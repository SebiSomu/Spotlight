class Order < ApplicationRecord
    belongs_to :user
    belongs_to :hold, optional: true
    has_many :tickets, dependent: :destroy

    STATUSES = %w[pending paid failed refunded].freeze

    validates :total_cents, numericality: { greater_than_or_equal_to: 0 }
    validates :status, inclusion: { in: STATUSES }
    validates :payment_reference, presence: true

    def total_dollars
        (total_cents / 100.0).round(2)
    end

    def formatted_created_at
        created_at.strftime("%b %d, %Y at %I:%M %p")
    end

    def as_json_payload
        {
            id: id,
            status: status,
            total_price: total_dollars,
            total_cents: total_cents,
            payment_reference: payment_reference,
            payment_method: payment_method,
            created_at: created_at.iso8601,
            formatted_date: formatted_created_at,
            tickets: tickets.map(&:as_json_payload)
        }
    end
end
