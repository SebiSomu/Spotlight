class CreateEvents < ActiveRecord::Migration[8.1]
    def change
        create_table :events do |t|
            t.string :title, null: false
            t.string :artist, null: false
            t.text :description
            t.datetime :starts_at, null: false
            t.string :status, null: false, default: "published"
            t.integer :min_price_cents, null: false, default: 0
            t.string :image_url
            t.references :venue, null: false, foreign_key: true

            t.timestamps
        end

        add_index :events, :status
        add_index :events, :starts_at
    end
end
