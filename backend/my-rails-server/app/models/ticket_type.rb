class TicketType < ApplicationRecord
    belongs_to :event

    validates :name, presence: true
    validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
    validates :quantity_available, numericality: { greater_than_or_equal_to: 0 }
    validates :quantity_remaining, numericality: { greater_than_or_equal_to: 0 }

    def price_dollars
        (price_cents / 100.0).round(2)
    end

    def as_json_payload
        {
            id: id,
            name: name,
            price: price_dollars,
            price_cents: price_cents,
            quantity_available: quantity_available,
            quantity_remaining: quantity_remaining,
            is_sold_out: quantity_remaining <= 0
        }
    end
end
