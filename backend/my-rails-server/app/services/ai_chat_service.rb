require "net/http"
require "json"
require "uri"

class AiChatService
  DEFAULT_AI_SERVICE_URL = ENV.fetch("AI_SERVICE_URL", "http://localhost:8000")

  def self.send_message(message:, history: [], user_latitude: nil, user_longitude: nil)
    url = URI.parse("#{DEFAULT_AI_SERVICE_URL}/chat")

    http = Net::HTTP.new(url.host, url.port)
    http.read_timeout = 30
    http.open_timeout = 5

    body = {
      message: message,
      history: history
    }
    if user_latitude.is_a?(Numeric) && user_longitude.is_a?(Numeric)
      body[:user_latitude] = user_latitude.to_f
      body[:user_longitude] = user_longitude.to_f
    end

    request = Net::HTTP::Post.new(url.path, { "Content-Type" => "application/json" })
    request.body = body.to_json

    begin
      response = http.request(request)
      if response.is_a?(Net::HTTPSuccess)
        parsed = JSON.parse(response.body)
        {
          "reply" => parsed["reply"],
          "sources" => parsed["sources"] || [],
          "needs_browser_geolocation" => !!parsed["needs_browser_geolocation"],
          "resolved_location" => parsed["resolved_location"],
          "error" => parsed["error"]
        }
      else
        { "error" => "AI service returned error (HTTP #{response.code})" }
      end
    rescue Errno::ECONNREFUSED, Timeout::Error => e
      Rails.logger.error("Failed to reach AI service: #{e.message}")
      { "error" => "AI assistant service is currently unavailable. Please try again later." }
    rescue => e
      Rails.logger.error("AI service error: #{e.message}")
      { "error" => "An unexpected error occurred while communicating with the AI service." }
    end
  end

  def self.sync_event(event_id, action: "upsert", async: true)
    return if event_id.blank?

    block = lambda do
      url = URI.parse("#{DEFAULT_AI_SERVICE_URL}/sync/event")
      http = Net::HTTP.new(url.host, url.port)
      http.read_timeout = 30
      http.open_timeout = 5

      request = Net::HTTP::Post.new(url.path, { "Content-Type" => "application/json" })
      request.body = { id: event_id.to_i, action: action.to_s }.to_json

      begin
        response = http.request(request)
        if response.is_a?(Net::HTTPSuccess)
          Rails.logger.info("AI Service synced event #{event_id} (#{action})")
        else
          Rails.logger.warn("AI Service failed to sync event #{event_id}: HTTP #{response.code}")
        end
      rescue => e
        Rails.logger.error("AI Service sync_event error for event #{event_id}: #{e.message}")
      end
    end

    if async
      Thread.new(&block)
    else
      block.call
    end
  end

  def self.sync_venue(venue_id, action: "upsert", async: true)
    return if venue_id.blank?

    block = lambda do
      url = URI.parse("#{DEFAULT_AI_SERVICE_URL}/sync/venue")
      http = Net::HTTP.new(url.host, url.port)
      http.read_timeout = 30
      http.open_timeout = 5

      request = Net::HTTP::Post.new(url.path, { "Content-Type" => "application/json" })
      request.body = { id: venue_id.to_i, action: action.to_s }.to_json

      begin
        response = http.request(request)
        if response.is_a?(Net::HTTPSuccess)
          Rails.logger.info("AI Service synced venue #{venue_id} (#{action})")
        else
          Rails.logger.warn("AI Service failed to sync venue #{venue_id}: HTTP #{response.code}")
        end
      rescue => e
        Rails.logger.error("AI Service sync_venue error for venue #{venue_id}: #{e.message}")
      end
    end

    if async
      Thread.new(&block)
    else
      block.call
    end
  end


  def self.trigger_ingestion
    url = URI.parse("#{DEFAULT_AI_SERVICE_URL}/ingest")

    http = Net::HTTP.new(url.host, url.port)
    http.read_timeout = 600
    http.open_timeout = 5

    request = Net::HTTP::Post.new(url.path, { "Content-Type" => "application/json" })
    request.body = {}.to_json

    begin
      response = http.request(request)
      if response.is_a?(Net::HTTPSuccess)
        JSON.parse(response.body)
      else
        { "status" => "error", "error" => "AI ingest returned HTTP #{response.code}" }
      end
    rescue Errno::ECONNREFUSED, Timeout::Error => e
      Rails.logger.error("Failed to reach AI service for ingest: #{e.message}")
      { "status" => "error", "error" => "AI service unreachable: #{e.message}" }
    rescue => e
      Rails.logger.error("AI ingest error: #{e.message}")
      { "status" => "error", "error" => e.message }
    end
  end
end


