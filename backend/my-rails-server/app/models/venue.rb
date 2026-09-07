class Venue < ApplicationRecord
    has_many :events, dependent: :destroy

    validates :name, presence: true
    validates :city, presence: true
    validates :capacity, numericality: { greater_than: 0 }, allow_nil: true

    scope :search, ->(query) {
        return all if query.blank?

        term = "%#{query.to_s.downcase.strip}%"
        where("LOWER(name) LIKE :term OR LOWER(city) LIKE :term OR LOWER(state) LIKE :term OR LOWER(address) LIKE :term", term: term)
    }

    after_commit :sync_with_ai_chatbot, on: [:create, :update]
    after_commit :delete_from_ai_chatbot, on: :destroy

    def location_display
        [city, state].compact_blank.join(", ")
    end

    def coordinates?
        latitude.present? && longitude.present?
    end

    def events_count
        events.count
    end

    def as_admin_json_payload
        as_json_payload.merge(
            events_count: events_count,
            created_at: created_at,
            updated_at: updated_at
        )
    end

    def as_json_payload
        {
            id: id,
            name: name,
            address: address,
            city: city,
            state: state,
            location: location_display,
            capacity: capacity,
            image_url: image_url,
            latitude: latitude,
            longitude: longitude
        }
    end

    private

    def sync_with_ai_chatbot
        AiChatService.sync_venue(id, action: "upsert")
    rescue => e
        Rails.logger.error("Failed to trigger AI sync for venue #{id}: #{e.message}")
    end

    def delete_from_ai_chatbot
        AiChatService.sync_venue(id, action: "delete")
    rescue => e
        Rails.logger.error("Failed to trigger AI delete sync for venue #{id}: #{e.message}")
    end
end
