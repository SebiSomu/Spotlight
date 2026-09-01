class CreateHolds < ActiveRecord::Migration[8.0]
  def change
    create_table :holds do |t|
      t.references :user, foreign_key: true, null: true
      t.references :ticket_type, foreign_key: true, null: false
      t.integer :quantity, null: false, default: 1
      t.string :status, null: false, default: "active"
      t.datetime :expires_at, null: false

      t.timestamps
    end

    add_index :holds, [:ticket_type_id, :status]
  end
end
