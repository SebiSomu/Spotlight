# Clear existing data in correct order
Event.destroy_all
Venue.destroy_all

puts "Seeding venues for real artists..."

hiram = Venue.create!(
    name: "Estadio Hiram Bithorn",
    address: "FDR Ave & Roosevelt Ave",
    city: "San Juan",
    state: "PR",
    capacity: 35000,
    image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"
)

kaseya = Venue.create!(
    name: "Kaseya Center",
    address: "601 Biscayne Blvd",
    city: "Miami",
    state: "FL",
    capacity: 19600,
    image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"
)

sofi = Venue.create!(
    name: "SoFi Stadium",
    address: "1001 Stadium Dr",
    city: "Inglewood",
    state: "CA",
    capacity: 70000,
    image_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80"
)

barclays = Venue.create!(
    name: "Barclays Center",
    address: "620 Atlantic Ave",
    city: "Brooklyn",
    state: "NY",
    capacity: 19000,
    image_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80"
)

chase = Venue.create!(
    name: "Chase Center",
    address: "1 Warriors Way",
    city: "San Francisco",
    state: "CA",
    capacity: 18064,
    image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"
)

metlife = Venue.create!(
    name: "MetLife Stadium",
    address: "1 MetLife Stadium Dr",
    city: "East Rutherford",
    state: "NJ",
    capacity: 82500,
    image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"
)

rose_bowl = Venue.create!(
    name: "Rose Bowl Stadium",
    address: "1001 Rose Bowl Dr",
    city: "Pasadena",
    state: "CA",
    capacity: 90888,
    image_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80"
)

puts "Seeding published events with real world-famous artists..."

Event.create!([
    {
        title: "DeBí TiRAR MáS FOToS World Tour",
        artist: "Bad Bunny",
        genre: "Reggaeton & Latin",
        description: "El Conejo Malo brings his record-breaking world tour to San Juan with an explosive reggaeton and Latin trap stadium production.",
        starts_at: DateTime.new(2026, 9, 18, 20, 30, 0),
        status: "published",
        min_price_cents: 19500,
        image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
        venue: hiram
    },
    {
        title: "Most Wanted Stadium Experience",
        artist: "Bad Bunny",
        genre: "Reggaeton & Latin",
        description: "An unforgettable energetic night of trap classics, dembow rhythms, and surprise special guest appearances in Miami.",
        starts_at: DateTime.new(2026, 10, 2, 21, 0, 0),
        status: "published",
        min_price_cents: 22000,
        image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
        venue: kaseya
    },
    {
        title: "The Eras Tour (Extended Show)",
        artist: "Taylor Swift",
        genre: "Pop",
        description: "A monumental 3-hour journey through every era of Taylor Swift's career with full stadium visual grandeur.",
        starts_at: DateTime.new(2026, 9, 25, 19, 0, 0),
        status: "published",
        min_price_cents: 28000,
        image_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
        venue: sofi
    },
    {
        title: "It's All A Blur Tour",
        artist: "Drake",
        genre: "Hip-Hop & Rap",
        description: "Drake performs his biggest chart-topping hits and rap anthems with an immersive 360-degree arena stage.",
        starts_at: DateTime.new(2026, 10, 10, 20, 0, 0),
        status: "published",
        min_price_cents: 21000,
        image_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
        venue: barclays
    },
    {
        title: "Hit Me Hard and Soft: Live",
        artist: "Billie Eilish",
        genre: "Pop",
        description: "Atmospheric, powerful vocal performances and striking visuals featuring Billie Eilish's latest critically acclaimed album.",
        starts_at: DateTime.new(2026, 10, 24, 19, 30, 0),
        status: "published",
        min_price_cents: 14500,
        image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
        venue: chase
    },
    {
        title: "After Hours til Dawn Stadium Tour",
        artist: "The Weeknd",
        genre: "R&B",
        description: "Cinematic synthpop, R&B, and pyro production as Abel Tesfaye lights up MetLife Stadium.",
        starts_at: DateTime.new(2026, 11, 5, 20, 0, 0),
        status: "published",
        min_price_cents: 17500,
        image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
        venue: metlife
    },
    {
        title: "Music of the Spheres World Tour",
        artist: "Coldplay",
        genre: "Alternative & Rock",
        description: "A breathtaking kinetic light show powered by solar and kinetic energy, featuring classic anthems and LED wristbands.",
        starts_at: DateTime.new(2026, 11, 14, 19, 0, 0),
        status: "published",
        min_price_cents: 16000,
        image_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
        venue: rose_bowl
    }
])

puts "Database seeded with real artists! Total venues: #{Venue.count}, total events: #{Event.count}."
