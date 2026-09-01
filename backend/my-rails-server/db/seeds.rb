# Clear existing data in correct order
Event.destroy_all
Venue.destroy_all

puts "Seeding venues..."

roxy = Venue.create!(
    name: "The Roxy Theatre",
    address: "9009 Sunset Blvd",
    city: "Los Angeles",
    state: "CA",
    capacity: 500,
    image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"
)

echostage = Venue.create!(
    name: "Echostage",
    address: "2135 Queens Chapel Rd NE",
    city: "Washington",
    state: "DC",
    capacity: 3000,
    image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"
)

bowery = Venue.create!(
    name: "Bowery Ballroom",
    address: "6 Delancey St",
    city: "New York",
    state: "NY",
    capacity: 575,
    image_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80"
)

msg = Venue.create!(
    name: "Madison Square Garden",
    address: "4 Pennsylvania Plaza",
    city: "New York",
    state: "NY",
    capacity: 19500,
    image_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80"
)

red_rocks = Venue.create!(
    name: "Red Rocks Amphitheatre",
    address: "18300 W Alameda Pkwy",
    city: "Morrison",
    state: "CO",
    capacity: 9525,
    image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"
)

puts "Seeding published events..."

Event.create!([
    {
        title: "Nocturnal Echoes World Tour",
        artist: "Marcus Vane",
        description: "An unforgettable evening of soulful electronic soundscapes and ambient melodies.",
        starts_at: DateTime.new(2026, 9, 14, 20, 0, 0),
        status: "published",
        min_price_cents: 7500,
        image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
        venue: roxy
    },
    {
        title: "Synthwave After Dark",
        artist: "Neon Drift",
        description: "High-octane retro electro beats with mesmerizing laser production.",
        starts_at: DateTime.new(2026, 9, 21, 21, 0, 0),
        status: "published",
        min_price_cents: 12000,
        image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
        venue: echostage
    },
    {
        title: "Intimate Acoustic Sessions",
        artist: "The Rust & Ruin",
        description: "Raw, unscripted indie rock performed in an intimate historic ballroom.",
        starts_at: DateTime.new(2026, 10, 3, 19, 30, 0),
        status: "published",
        min_price_cents: 4500,
        image_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
        venue: bowery
    },
    {
        title: "Pyrotechnic Arena Spectacular",
        artist: "Aria Blaze",
        description: "Arena-shattering vocals backed by massive pyrotechnics and full orchestral choir.",
        starts_at: DateTime.new(2026, 10, 18, 20, 0, 0),
        status: "published",
        min_price_cents: 18500,
        image_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
        venue: msg
    },
    {
        title: "Sunset Mountain Rhythms",
        artist: "Solaris Collective",
        description: "Under the stars at Red Rocks — deep house and organic downtempo live ensemble.",
        starts_at: DateTime.new(2026, 10, 25, 18, 30, 0),
        status: "published",
        min_price_cents: 9500,
        image_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
        venue: red_rocks
    },
    {
        title: "Midnight Jazz & Blues Jam",
        artist: "Miles & The Rhythm Kings",
        description: "Classic brass improvisations, late-night cocktails, and deep bass grooves.",
        starts_at: DateTime.new(2026, 11, 2, 22, 0, 0),
        status: "published",
        min_price_cents: 6000,
        image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
        venue: roxy
    }
])

puts "Database seeded successfully! Created #{Venue.count} venues and #{Event.count} events."
