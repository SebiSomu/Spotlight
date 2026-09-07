class Event < ApplicationRecord
    belongs_to :venue
    has_many :ticket_types, dependent: :destroy
    has_many :tickets, through: :ticket_types

    STATUSES = %w[draft published cancelled sold_out].freeze
    GENRES = ["Reggaeton & Latin", "Hip-Hop & Rap", "Pop", "R&B", "Alternative & Rock", "Electronic"].freeze

    validates :title, presence: true
    validates :artist, presence: true
    validates :genre, presence: true
    validates :starts_at, presence: true
    validates :status, presence: true, inclusion: { in: STATUSES }
    validates :min_price_cents, numericality: { greater_than_or_equal_to: 0 }

    after_commit :sync_with_ai_chatbot, on: [:create, :update]
    after_commit :delete_from_ai_chatbot, on: :destroy


    scope :published, -> { where(status: "published") }
    scope :upcoming, -> { where("starts_at >= ?", Time.current).order(starts_at: :asc) }

    scope :by_genre, ->(genre_name) {
        return all if genre_name.blank? || genre_name == "All"

        where("LOWER(genre) = ?", genre_name.to_s.downcase.strip)
    }

    scope :by_status, ->(status_val) {
        return all if status_val.blank? || status_val == "All"

        where(status: status_val.to_s.downcase.strip)
    }

    scope :by_venue, ->(venue_id_val) {
        return all if venue_id_val.blank? || venue_id_val == "All"

        where(venue_id: venue_id_val)
    }

    scope :search, ->(query) {
        return all if query.blank?

        term = "%#{query.to_s.downcase.strip}%"
        joins(:venue).where(
            "LOWER(events.title) LIKE :term OR LOWER(events.artist) LIKE :term OR LOWER(events.genre) LIKE :term OR LOWER(venues.name) LIKE :term OR LOWER(venues.city) LIKE :term",
            term: term
        )
    }

    scope :by_date, ->(date_str) {
        return all if date_str.blank?

        begin
            date = Date.parse(date_str)
            where(starts_at: date.beginning_of_day..date.end_of_day)
        rescue ArgumentError
            all
        end
    }

    def min_price_dollars
        min = ticket_types.minimum(:price_cents) || min_price_cents
        (min / 100.0).round(2)
    end

    def formatted_date
        starts_at.strftime("%b %d, %Y")
    end

    def formatted_time
        starts_at.strftime("%I:%M %p")
    end

    def total_capacity
        ticket_types.sum(:quantity_available)
    end

    def total_remaining
        ticket_types.sum(:quantity_remaining)
    end

    def tickets_sold_count
        tickets.where(status: "valid").count
    end

    def as_admin_json_payload
        as_json_payload.merge(
            total_capacity: total_capacity,
            total_remaining: total_remaining,
            tickets_sold_count: tickets_sold_count,
            created_at: created_at,
            updated_at: updated_at
        )
    end

    def as_json_payload
        {
            id: id,
            title: title,
            artist: artist,
            genre: genre,
            description: description,
            starts_at: starts_at,
            formatted_date: formatted_date,
            formatted_time: formatted_time,
            status: status,
            min_price: min_price_dollars,
            min_price_cents: min_price_cents,
            image_url: image_url,
            venue: venue&.as_json_payload,
            ticket_types: ticket_types.order(price_cents: :asc).map(&:as_json_payload)
        }
    end

    private

    def sync_with_ai_chatbot
        AiChatService.sync_event(id, action: "upsert")
    rescue => e
        Rails.logger.error("Failed to trigger AI sync for event #{id}: #{e.message}")
    end

    def delete_from_ai_chatbot
        AiChatService.sync_event(id, action: "delete")
    rescue => e
        Rails.logger.error("Failed to trigger AI delete sync for event #{id}: #{e.message}")
    end
end
