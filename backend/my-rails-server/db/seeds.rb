require "json"
require "date"
require "net/http"
require "uri"

seeds_file = File.join(__dir__, "data", "seeds_data.json")

unless File.exist?(seeds_file)
    puts "Seed dataset missing at #{seeds_file}!"
    exit 1
end

raw_data = File.read(seeds_file)
seeds_data = JSON.parse(raw_data)

module NominatimGeocoder
  USER_AGENT = "SpotlightAI-Seeder/1.0"

  def self.geocode(address:, city:, state:)
    query = [address, city, state].compact.reject(&:empty?).join(", ")
    encoded = URI.encode_www_form_component(query)
    url = URI("https://nominatim.openstreetmap.org/search?q=#{encoded}&format=json&limit=1")

    req = Net::HTTP::Get.new(url)
    req["User-Agent"] = USER_AGENT
    req["Accept"] = "application/json"

    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true
    http.open_timeout = 8
    http.read_timeout = 10

    response = http.request(req)
    return nil unless response.is_a?(Net::HTTPSuccess)

    results = JSON.parse(response.body) rescue nil
    return nil unless results.is_a?(Array) && results.any?

    first = results.first
    lat = first["lat"]&.to_f
    lng = first["lon"]&.to_f
    return nil unless lat && lng

    [lat, lng]
  rescue StandardError => e
    puts "  ! Nominatim lookup failed for #{city}: #{e.message}"
    nil
  end
end

puts "Loading venues from JSON dataset..."

venues_by_name = {}
seeds_data["venues"].each do |data|
    venue = Venue.find_or_initialize_by(name: data["name"])

    attrs = {
        address: data["address"],
        city: data["city"],
        state: data["state"],
        capacity: data["capacity"],
        image_url: data["image_url"]
    }

    if data["latitude"] && data["longitude"]
      attrs[:latitude] = data["latitude"]
      attrs[:longitude] = data["longitude"]
    end

    venue.update!(attrs)

    if venue.latitude.nil? || venue.longitude.nil?
      print "  Looking up coordinates for #{venue.name} via Nominatim..."
      coords = NominatimGeocoder.geocode(
        address: venue.address.to_s,
        city: venue.city.to_s,
        state: venue.state.to_s
      )
      if coords
        lat, lng = coords
        venue.update!(latitude: lat, longitude: lng)
        puts " OK (#{lat.round(4)}, #{lng.round(4)})"
      else
        puts " SKIP (no result; venue #{venue.name} will lack coords)"
      end
      sleep 1.1
    else
      puts "  Using seed coordinates for #{venue.name} (#{venue.latitude.to_f.round(4)}, #{venue.longitude.to_f.round(4)})"
    end

    venues_by_name[data["name"]] = venue
end

puts "Seeded #{venues_by_name.size} venues from JSON."

puts "Loading published events and ticket types from JSON dataset..."

total_ticket_types = 0

seeds_data["events"].each do |data|
    venue = venues_by_name[data["venue_name"]]
    unless venue
        puts "Warning: Venue #{data['venue_name']} not found for event #{data['title']}"
        next
    end

    starts_at = DateTime.parse(data["starts_at"])

    event = Event.find_or_initialize_by(
        title: data["title"],
        artist: data["artist"]
    )

    event.update!(
        genre: data["genre"],
        description: data["description"],
        starts_at: starts_at,
        status: data["status"],
        min_price_cents: data["min_price_cents"],
        image_url: data["image_url"],
        venue: venue
    )

    if data["ticket_types"].is_a?(Array)
        data["ticket_types"].each do |tt_data|
            tt = event.ticket_types.find_or_initialize_by(name: tt_data["name"])
            tt.update!(
                price_cents: tt_data["price_cents"],
                quantity_available: tt_data["quantity_available"],
                quantity_remaining: tt_data["quantity_remaining"]
            )
            total_ticket_types += 1
        end
    end
end

puts "Successfully seeded #{Event.count} events with #{total_ticket_types} ticket types from seeds_data.json!"

puts "Seeding default admin user..."
admin_user = User.find_or_initialize_by(email: "sebisomu@spotlight.com")
admin_user.first_name = "Sebi"
admin_user.last_name = "Somu"
admin_user.role = "admin"
admin_user.password = "password123"
admin_user.password_confirmation = "password123"
admin_user.save!
puts "Seeded admin user: #{admin_user.email} (Role: #{admin_user.role})"

