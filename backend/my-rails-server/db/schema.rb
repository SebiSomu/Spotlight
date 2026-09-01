# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_01_172010) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "events", force: :cascade do |t|
    t.string "artist", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "image_url"
    t.integer "min_price_cents", default: 0, null: false
    t.datetime "starts_at", null: false
    t.string "status", default: "published", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "venue_id", null: false
    t.index ["starts_at"], name: "index_events_on_starts_at"
    t.index ["status"], name: "index_events_on_status"
    t.index ["venue_id"], name: "index_events_on_venue_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "first_name"
    t.string "last_name"
    t.string "password_digest", null: false
    t.string "role", default: "customer", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "venues", force: :cascade do |t|
    t.string "address"
    t.integer "capacity"
    t.string "city"
    t.datetime "created_at", null: false
    t.string "image_url"
    t.string "name"
    t.string "state"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "events", "venues"
end
