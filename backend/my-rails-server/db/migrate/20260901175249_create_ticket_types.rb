class CreateTicketTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :ticket_types do |t|
      t.string :name
      t.integer :price_cents
      t.integer :quantity_available
      t.integer :quantity_remaining
      t.references :event, null: false, foreign_key: true

      t.timestamps
    end
  end
end
