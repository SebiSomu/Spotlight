class CreateOrdersAndTickets < ActiveRecord::Migration[8.0]
  def change
    create_table :orders do |t|
      t.references :user, foreign_key: true, null: false
      t.references :hold, foreign_key: true, null: true
      t.string :status, null: false, default: "paid"
      t.integer :total_cents, null: false
      t.string :payment_reference, null: false
      t.string :payment_method, null: false, default: "card"

      t.timestamps
    end

    create_table :tickets do |t|
      t.references :order, foreign_key: true, null: false
      t.references :ticket_type, foreign_key: true, null: false
      t.string :ticket_code, null: false
      t.string :status, null: false, default: "valid"

      t.timestamps
    end

    add_index :tickets, :ticket_code, unique: true
    add_index :orders, [:user_id, :created_at]
  end
end
