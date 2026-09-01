# Seed venues idempotently
venues_data = [
    {
        name: "Estadio Hiram Bithorn",
        address: "FDR Ave & Roosevelt Ave",
        city: "San Juan",
        state: "PR",
        capacity: 35000,
        image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuMZsTU_KPFa9TR8MgrSAnHv9JkE4LozaOULeYO_-jaQ&s=10"
    },
    {
        name: "Kaseya Center",
        address: "601 Biscayne Blvd",
        city: "Miami",
        state: "FL",
        capacity: 19600,
        image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuMZsTU_KPFa9TR8MgrSAnHv9JkE4LozaOULeYO_-jaQ&s=10"
    },
    {
        name: "SoFi Stadium",
        address: "1001 Stadium Dr",
        city: "Inglewood",
        state: "CA",
        capacity: 70000,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/960px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png"
    },
    {
        name: "Barclays Center",
        address: "620 Atlantic Ave",
        city: "Brooklyn",
        state: "NY",
        capacity: 19000,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/1/15/Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg"
    },
    {
        name: "Chase Center",
        address: "1 Warriors Way",
        city: "San Francisco",
        state: "CA",
        capacity: 18064,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/c/c7/BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg"
    },
    {
        name: "MetLife Stadium",
        address: "1 MetLife Stadium Dr",
        city: "East Rutherford",
        state: "NJ",
        capacity: 82500,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait_by_Brian_Ziff.jpg/960px-The_Weeknd_Portrait_by_Brian_Ziff.jpg"
    },
    {
        name: "Rose Bowl Stadium",
        address: "1001 Rose Bowl Dr",
        city: "Pasadena",
        state: "CA",
        capacity: 90888,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/ColdplayWembley120925_%28cropped%29.jpg/960px-ColdplayWembley120925_%28cropped%29.jpg"
    }
]

venues_by_name = {}
venues_data.each do |data|
    v = Venue.find_or_initialize_by(name: data[:name])
    v.update!(data)
    venues_by_name[data[:name]] = v
end

puts "Seeded #{venues_by_name.size} venues."

# Seed events idempotently
events_data = [
    {
        title: "DeBí TiRAR MáS FOToS World Tour",
        artist: "Bad Bunny",
        genre: "Reggaeton & Latin",
        description: "El Conejo Malo brings his record-breaking world tour to San Juan with an explosive reggaeton and Latin trap stadium production.",
        starts_at: DateTime.new(2026, 9, 18, 20, 30, 0),
        status: "published",
        min_price_cents: 19500,
        image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuMZsTU_KPFa9TR8MgrSAnHv9JkE4LozaOULeYO_-jaQ&s=10",
        venue: venues_by_name["Estadio Hiram Bithorn"]
    },
    {
        title: "Most Wanted Stadium Experience",
        artist: "Bad Bunny",
        genre: "Reggaeton & Latin",
        description: "An unforgettable energetic night of trap classics, dembow rhythms, and surprise special guest appearances in Miami.",
        starts_at: DateTime.new(2026, 10, 2, 21, 0, 0),
        status: "published",
        min_price_cents: 22000,
        image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuMZsTU_KPFa9TR8MgrSAnHv9JkE4LozaOULeYO_-jaQ&s=10",
        venue: venues_by_name["Kaseya Center"]
    },
    {
        title: "The Eras Tour (Extended Show)",
        artist: "Taylor Swift",
        genre: "Pop",
        description: "A monumental 3-hour journey through every era of Taylor Swift's career with full stadium visual grandeur.",
        starts_at: DateTime.new(2026, 9, 25, 19, 0, 0),
        status: "published",
        min_price_cents: 28000,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/960px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png",
        venue: venues_by_name["SoFi Stadium"]
    },
    {
        title: "It's All A Blur Tour",
        artist: "Drake",
        genre: "Hip-Hop & Rap",
        description: "Drake performs his biggest chart-topping hits and rap anthems with an immersive 360-degree arena stage.",
        starts_at: DateTime.new(2026, 10, 10, 20, 0, 0),
        status: "published",
        min_price_cents: 21000,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/1/15/Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg",
        venue: venues_by_name["Barclays Center"]
    },
    {
        title: "Hit Me Hard and Soft: Live",
        artist: "Billie Eilish",
        genre: "Pop",
        description: "Atmospheric, powerful vocal performances and striking visuals featuring Billie Eilish's latest critically acclaimed album.",
        starts_at: DateTime.new(2026, 10, 24, 19, 30, 0),
        status: "published",
        min_price_cents: 14500,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/c/c7/BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg",
        venue: venues_by_name["Chase Center"]
    },
    {
        title: "After Hours til Dawn Stadium Tour",
        artist: "The Weeknd",
        genre: "R&B",
        description: "Cinematic synthpop, R&B, and pyro production as Abel Tesfaye lights up MetLife Stadium.",
        starts_at: DateTime.new(2026, 11, 5, 20, 0, 0),
        status: "published",
        min_price_cents: 17500,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait_by_Brian_Ziff.jpg/960px-The_Weeknd_Portrait_by_Brian_Ziff.jpg",
        venue: venues_by_name["MetLife Stadium"]
    },
    {
        title: "Music of the Spheres World Tour",
        artist: "Coldplay",
        genre: "Alternative & Rock",
        description: "A breathtaking kinetic light show powered by solar and kinetic energy, featuring classic anthems and LED wristbands.",
        starts_at: DateTime.new(2026, 11, 14, 19, 0, 0),
        status: "published",
        min_price_cents: 16000,
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/ColdplayWembley120925_%28cropped%29.jpg/960px-ColdplayWembley120925_%28cropped%29.jpg",
        venue: venues_by_name["Rose Bowl Stadium"]
    }
]

events_data.each do |data|
    e = Event.find_or_initialize_by(title: data[:title], artist: data[:artist])
    e.update!(data)
end

puts "Seeded #{Event.count} published events with user's specific Bad Bunny photo!"
