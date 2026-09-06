class AddLatitudeLongitudeToVenues < ActiveRecord::Migration[8.1]
  def change
    add_column :venues, :latitude, :decimal, precision: 10, scale: 6
    add_column :venues, :longitude, :decimal, precision: 10, scale: 6
    add_index :venues, [:latitude, :longitude]
  end
end
