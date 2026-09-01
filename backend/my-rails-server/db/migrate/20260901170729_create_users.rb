class CreateUsers < ActiveRecord::Migration[8.1]
    def change
        create_table :users do |t|
            t.string :email, null: false
            t.string :password_digest, null: false
            t.string :first_name
            t.string :last_name
            t.string :role, null: false, default: "customer"

            t.timestamps
        end
        add_index :users, :email, unique: true
    end
end
