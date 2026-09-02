require "net/http"
require "json"
require "uri"

class AiChatService
  DEFAULT_AI_SERVICE_URL = ENV.fetch("AI_SERVICE_URL", "http://localhost:8000")

  def self.send_message(message:, history: [])
    url = URI.parse("#{DEFAULT_AI_SERVICE_URL}/chat")

    http = Net::HTTP.new(url.host, url.port)
    http.read_timeout = 30
    http.open_timeout = 5

    request = Net::HTTP::Post.new(url.path, { "Content-Type" => "application/json" })
    request.body = {
      message: message,
      history: history
    }.to_json

    begin
      response = http.request(request)
      if response.is_a?(Net::HTTPSuccess)
        JSON.parse(response.body)
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
