class CreateVenues < ActiveRecord::Migration[8.1]
  def change
    create_table :venues do |t|
      t.string :name
      t.string :address
      t.string :city
      t.string :state
      t.integer :capacity
      t.string :image_url

      t.timestamps
    end
  end
end
