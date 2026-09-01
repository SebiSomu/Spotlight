require "securerandom"

class Ticket < ApplicationRecord
    belongs_to :order
    belongs_to :ticket_type

    STATUSES = %w[valid used cancelled].freeze

    validates :ticket_code, presence: true, uniqueness: true
    validates :status, inclusion: { in: STATUSES }

    before_validation :generate_ticket_code, on: :create

    def as_json_payload
        {
            id: id,
            ticket_code: ticket_code,
            status: status,
            ticket_type_name: ticket_type.name,
            event_title: ticket_type.event.title,
            artist: ticket_type.event.artist,
            genre: ticket_type.event.genre,
            event_image_url: ticket_type.event.image_url,
            venue_name: ticket_type.event.venue.name,
            formatted_date: ticket_type.event.formatted_date,
            formatted_time: ticket_type.event.formatted_time,
            price_dollars: ticket_type.price_dollars
        }
    end

    private

    def generate_ticket_code
        return if ticket_code.present?

        loop do
            code = "SPL-" + SecureRandom.alphanumeric(8).upcase
            self.ticket_code = code
            break unless Ticket.exists?(ticket_code: code)
        end
    end
end
