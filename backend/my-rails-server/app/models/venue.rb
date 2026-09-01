class Venue < ApplicationRecord
    has_many :events, dependent: :destroy

    validates :name, presence: true
    validates :city, presence: true
    validates :capacity, numericality: { greater_than: 0 }, allow_nil: true

    def location_display
        [city, state].compact_blank.join(", ")
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
            image_url: image_url
        }
    end
end
