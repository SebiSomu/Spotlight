class Hold < ApplicationRecord
    belongs_to :user, optional: true
    belongs_to :ticket_type

    STATUSES = %w[active expired converted].freeze

    validates :quantity, numericality: { greater_than: 0, only_integer: true }
    validates :status, inclusion: { in: STATUSES }
    validates :expires_at, presence: true

    scope :active, -> { where(status: "active").where("expires_at > ?", Time.current) }
    scope :expired_pending, -> { where(status: "active").where("expires_at <= ?", Time.current) }

    def expired?
        expires_at <= Time.current
    end

    def seconds_remaining
        [(expires_at - Time.current).to_i, 0].max
    end

    def as_json_payload
        {
            id: id,
            ticket_type_id: ticket_type_id,
            ticket_type_name: ticket_type.name,
            quantity: quantity,
            status: status,
            expires_at: expires_at.iso8601,
            seconds_remaining: seconds_remaining,
            total_cents: ticket_type.price_cents * quantity,
            total_price: (ticket_type.price_cents * quantity / 100.0).round(2)
        }
    end
end
