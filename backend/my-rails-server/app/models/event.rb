class Event < ApplicationRecord
    belongs_to :venue

    STATUSES = %w[draft published cancelled sold_out].freeze
    GENRES = ["Reggaeton & Latin", "Hip-Hop & Rap", "Pop", "R&B", "Alternative & Rock", "Electronic"].freeze

    validates :title, presence: true
    validates :artist, presence: true
    validates :genre, presence: true
    validates :starts_at, presence: true
    validates :status, presence: true, inclusion: { in: STATUSES }
    validates :min_price_cents, numericality: { greater_than_or_equal_to: 0 }

    scope :published, -> { where(status: "published") }
    scope :upcoming, -> { where("starts_at >= ?", Time.current).order(starts_at: :asc) }

    scope :by_genre, ->(genre_name) {
        return all if genre_name.blank? || genre_name == "All"

        where("LOWER(genre) = ?", genre_name.to_s.downcase.strip)
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
        (min_price_cents / 100.0).round(2)
    end

    def formatted_date
        starts_at.strftime("%b %d, %Y")
    end

    def formatted_time
        starts_at.strftime("%I:%M %p")
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
            venue: venue.as_json_payload
        }
    end
end
