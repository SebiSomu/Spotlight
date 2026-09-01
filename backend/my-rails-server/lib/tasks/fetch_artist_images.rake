require "net/http"
require "json"
require "uri"

namespace :events do
    desc "Fetch official artist profile images from Wikipedia PageImages API and update published events"
    task fetch_artist_images: :environment do
        puts "Starting official artist image fetch..."

        events = Event.all
        if events.empty?
            puts "No events found in database."
            next
        end

        updated_count = 0

        # Custom Wikipedia title mappings for artists with disambiguation pages
        WIKI_MAPPINGS = {
            "Drake" => "Drake_(musician)"
        }.freeze

        events.each do |event|
            artist_name = event.artist
            formatted_title = WIKI_MAPPINGS[artist_name] || artist_name.strip.tr(" ", "_")

            url = URI("https://en.wikipedia.org/w/api.php?action=query&titles=#{URI.encode_www_form_component(formatted_title)}&prop=pageimages&format=json&pithumbsize=800")
            
            request = Net::HTTP::Get.new(url)
            request["User-Agent"] = "SpotlightConcerts/1.0 (contact@spotlight.com)"

            begin
                response = Net::HTTP.start(url.host, url.port, use_ssl: true) do |http|
                    http.request(request)
                end

                if response.is_a?(Net::HTTPSuccess)
                    data = JSON.parse(response.body)
                    pages = data.dig("query", "pages") || {}
                    page_id = pages.keys.first

                    if page_id && page_id != "-1"
                        image_source = pages.dig(page_id, "thumbnail", "source")

                        if image_source.present?
                            # Strip tracking query params for clean URLs
                            clean_url = image_source.split("?").first
                            event.update!(image_url: clean_url)
                            updated_count += 1
                            puts "Updated #{artist_name}: #{clean_url}"
                        else
                            puts "No thumbnail found for #{artist_name}."
                        end
                    else
                        puts "Wikipedia page not found for #{artist_name}."
                    end
                else
                    puts "Failed HTTP request for #{artist_name}: #{response.code}"
                end
            rescue => e
                puts "Error fetching image for #{artist_name}: #{e.message}"
            end
        end

        puts "Finished artist image sync! Updated #{updated_count} event records."
    end
end
