require "json"
require "date"

seeds_file = File.join(__dir__, "data", "seeds_data.json")

unless File.exist?(seeds_file)
    puts "Seed dataset missing at #{seeds_file}!"
    exit 1
end

raw_data = File.read(seeds_file)
seeds_data = JSON.parse(raw_data)

puts "Loading venues from JSON dataset..."

venues_by_name = {}
seeds_data["venues"].each do |data|
    venue = Venue.find_or_initialize_by(name: data["name"])
    venue.update!(
        address: data["address"],
        city: data["city"],
        state: data["state"],
        capacity: data["capacity"],
        image_url: data["image_url"]
    )
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
