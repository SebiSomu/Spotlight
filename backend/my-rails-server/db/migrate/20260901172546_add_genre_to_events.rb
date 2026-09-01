class AddGenreToEvents < ActiveRecord::Migration[8.1]
  def change
    add_column :events, :genre, :string
  end
end
