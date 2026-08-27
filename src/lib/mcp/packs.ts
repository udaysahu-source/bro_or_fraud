// Shared pack data used by MCP tools. Includes a small curated word
// set per pack for `roll_match` — the app's UI carries only pack metadata.

export type PackMeta = {
  id: string;
  name: string;
  tag: string;
  wordCount: number;
  description: string;
};

export type PackData = PackMeta & { words: string[] };

export const PACKS: PackData[] = [
  {
    id: "college-life",
    name: "College Life",
    tag: "COLLEGE",
    wordCount: 40,
    description: "Assignment, exams, canteen chill, and backlog anxiety.",
    words: [
      "Assignment", "Attendance", "Proxy", "Backbench", "Frontbench",
      "Semester", "Backlog", "CGPA", "Viva", "Lab",
      "Professor", "HOD", "Project", "Exam", "Notes",
      "Canteen", "Hostel", "Library", "Placement", "Internship",
      "Bunking", "Mass Bunk", "Deans List", "Syllabus", "Rusticate",
      "Scholarship", "Convocation", "Senior", "Junior", "Ragging",
      "Freshers", "Fest", "Symposium", "Workshop", "Club",
      "Societies", "Hostel Warden", "Night Out", "Maggi Run", "Exam Fee"
    ]
  },
  {
    id: "relationships",
    name: "Relationships",
    tag: "RELATION",
    wordCount: 40,
    description: "Crushes, breakups, flirting, and red flags.",
    words: [
      "Crush", "Ex", "Proposal", "Date", "Ghosting",
      "Friendzone", "Breakup", "Heartbreak", "Love", "Marriage",
      "Jealous", "Cheating", "Soulmate", "Wedding", "Flirting",
      "Kiss", "Hug", "Single", "Situationship", "Red Flag",
      "Green Flag", "Hard Launch", "Soft Launch", "Date Night", "Valentine",
      "Anniversary", "Long Distance", "Match", "Swipe Right", "Swipe Left",
      "Block", "Unfollow", "Seen Zone", "Typing...", "Spark",
      "Commitment", "Heart Eyes", "Toxic", "Heartbreaker", "Puppy Love"
    ]
  },
  {
    id: "gen-z",
    name: "Gen Z",
    tag: "GENZ",
    wordCount: 40,
    description: "Rizz, aura, cooked, cap, and brainrot terms.",
    words: [
      "Rizz", "Sigma", "Aura", "Delulu", "NPC",
      "GOAT", "Cooked", "Cringe", "POV", "Flex",
      "Simp", "Meme", "Viral", "Ratio", "Reels",
      "Trending", "Brainrot", "Locked In", "Touch Grass", "Glow Up",
      "Ate", "Left No Crumbs", "Slay", "Bet", "No Cap",
      "Bruh", "Salty", "Ghosted", "Main Character", "Tea",
      "Spill the Tea", "Bussin", "Sheesh", "Skibidi", "W",
      "L", "Opp", "Periodt", "Understood the Assignment", "Finna"
    ]
  },
  {
    id: "indian-parents",
    name: "Indian Parents",
    tag: "PARENTS",
    wordCount: 40,
    description: "Chappals, curfew lectures, and Sharma Ji ka beta comparison.",
    words: [
      "Chappal", "Belt", "Remote", "Electricity Bill", "Sharma Ji",
      "Doctor", "Engineer", "Tuition", "Homework", "Savings",
      "LIC", "FD", "Relatives", "Marriage", "Marks",
      "Curfew", "Lecture", "Newspaper", "TV", "Scooter",
      "WhatsApp University", "Good Morning Message", "Beta", "Gold Biscuit", "Sarkari Naukri",
      "Fixed Deposit", "Cousins", "Sanskari", "Blessings", "Almanac",
      "Yoga", "Vegetable Market", "Bargaining", "Tupperware", "Pickle",
      "Karela", "Warm Water", "Amla Juice", "Chyawanprash", "Beti"
    ]
  },
  {
    id: "food",
    name: "Food",
    tag: "FOOD",
    wordCount: 40,
    description: "Midnight Maggi runs, pani puri, and biryani cravings.",
    words: [
      "Pizza", "Burger", "Biryani", "Momos", "Maggi",
      "Paneer", "Dosa", "Idli", "Samosa", "Chai",
      "Coffee", "Ice Cream", "Chocolate", "Pasta", "Sandwich",
      "Paratha", "Jalebi", "Pani Puri", "Cake", "Noodles",
      "Shawarma", "Butter Chicken", "Waffles", "Pancakes", "Pav Bhaji",
      "Chole Bhature", "Lassi", "Cold Coffee", "Momo Chutney", "Sushi",
      "Tacos", "Ramen", "Garlic Bread", "French Fries", "Mocktail",
      "Gulab Jamun", "Rasgulla", "Tandoori Chicken", "Kebab", "Nachos"
    ]
  },
  {
    id: "cricket",
    name: "Cricket",
    tag: "CRICKET",
    wordCount: 40,
    description: "Dhoni finishes, yorkers, and IPL group debates.",
    words: [
      "Kohli", "Dhoni", "Rohit", "Sachin", "Bat",
      "Ball", "Wicket", "Six", "Four", "Catch",
      "Bowler", "Batsman", "Spinner", "Yorker", "IPL",
      "World Cup", "Umpire", "Helmet", "Stumps", "Boundary",
      "Free Hit", "No Ball", "Wide", "Super Over", "Century",
      "Duck", "Clean Bowled", "LBW", "Run Out", "Stumped",
      "Powerplay", "Toss", "Pitch", "Pavilion", "Cheerleaders",
      "Trophy", "All-rounder", "Hat-trick", "Appeal", "DRS"
    ]
  },
  {
    id: "gaming",
    name: "Gaming",
    tag: "GAME",
    wordCount: 40,
    description: "Valorant ranks, BGMI loot, and pro vs noob squabbles.",
    words: [
      "BGMI", "Free Fire", "Minecraft", "Valorant", "Roblox",
      "PlayStation", "Xbox", "Noob", "Pro", "Sniper",
      "Loot", "Skin", "Rank", "Victory", "Headshot",
      "Camping", "Respawn", "Controller", "Keyboard", "Mouse",
      "Steam", "Discord", "Ping", "Lag", "Clutch",
      "Gamer Girl", "RGB Lights", "Graphics Card", "Headset", "Joystick",
      "Boss Fight", "Speedrun", "NPC", "Mod", "Easter Egg",
      "Glitch", "Save Game", "Skins", "Console", "Level Up"
    ]
  },
  {
    id: "anime",
    name: "Anime",
    tag: "ANIME",
    wordCount: 40,
    description: "Ninja paths, devil fruits, shoujo and shonen tropes.",
    words: [
      "Naruto", "Luffy", "Zoro", "Gojo", "Sukuna",
      "Titan", "Sharingan", "Rasengan", "Bankai", "Hokage",
      "Pirate", "Marine", "Hero", "Villain", "Sensei",
      "Ninja", "Samurai", "Devil Fruit", "Curse", "Anime",
      "Otaku", "Manga", "Cosplay", "Waifu", "Husbando",
      "Subbed", "Dubbed", "Chibi", "Shonen", "Shojo",
      "Isekai", "Kawaii", "Kamehameha", "Death Note", "Super Saiyan",
      "One Piece", "Attack on Titan", "Demon Slayer", "Jujutsu Kaisen", "My Hero Academia"
    ]
  },
  {
    id: "movies",
    name: "Movies",
    tag: "MOVIE",
    wordCount: 40,
    description: "Climax scenes, popcorn buckets, and K-Jo blockbusters.",
    words: [
      "Hero", "Villain", "Director", "Actor", "Cinema",
      "Popcorn", "Interval", "Trailer", "Comedy", "Horror",
      "Thriller", "Romance", "Action", "Oscar", "Netflix",
      "OTT", "Bollywood", "Hollywood", "Climax", "Sequel",
      "Blockbuster", "Casting", "Box Office", "Screenplay", "Stunt",
      "Dialogue", "Autograph", "Celebrity", "Red Carpet", "Sci-Fi",
      "Documentary", "Indie Film", "Spoiler", "Plot Twist", "Dubbing",
      "Soundtrack", "Cinephile", "Review", "Rating", "Fan Club"
    ]
  },
  {
    id: "bikes",
    name: "Bikes",
    tag: "BIKES",
    wordCount: 40,
    description: "Royal Enfield classic thumps and KTM revs.",
    words: [
      "Royal Enfield", "KTM", "Yamaha", "Honda", "Helmet",
      "Clutch", "Brake", "Gear", "Engine", "Exhaust",
      "Petrol", "Mileage", "ABS", "Ride", "Wheelie",
      "Chain", "Tyre", "Mirror", "Speed", "Highway",
      "Superbike", "Cruiser", "Dirt Bike", "Pillion", "Throttle",
      "Accelerator", "Kickstart", "Key", "Headlight", "Tail Light",
      "Indicator", "Shock Absorber", "Mudguard", "Chain Lube", "Jacket",
      "Gloves", "Biker Gang", "Track Day", "Roadside Assistance", "Fuel Tank"
    ]
  },
  {
    id: "travel",
    name: "Travel",
    tag: "TRAVEL",
    wordCount: 40,
    description: "Goa trips, Manali escapes, and backpack maps.",
    words: [
      "Goa", "Manali", "Kashmir", "Beach", "Mountain",
      "Train", "Flight", "Passport", "Visa", "Hotel",
      "Resort", "Camping", "Backpack", "Suitcase", "Taxi",
      "Metro", "Map", "Road Trip", "Sunrise", "Sunset",
      "Wanderlust", "Souvenir", "Luggage", "Boarding Pass", "Duty Free",
      "Hostel", "Airbnb", "Local Guide", "Itinerary", "Sightseeing",
      "Adventure", "Hiking", "Trekking", "Cruise", "Island",
      "Waterfall", "Forest", "Desert", "Camera", "Postcard"
    ]
  },
  {
    id: "body-parts",
    name: "Body Parts",
    tag: "BODY",
    wordCount: 40,
    description: "Instantly recognizable anatomy names.",
    words: [
      "Head", "Hair", "Forehead", "Eye", "Eyebrow",
      "Ear", "Nose", "Mouth", "Tongue", "Teeth",
      "Neck", "Shoulder", "Chest", "Heart", "Stomach",
      "Hand", "Finger", "Knee", "Foot", "Toe",
      "Brain", "Skull", "Lip", "Chin", "Cheek",
      "Eyelash", "Throat", "Elbow", "Wrist", "Palm",
      "Thumb", "Nail", "Waist", "Hip", "Leg",
      "Ankle", "Heel", "Skin", "Blood", "Bone"
    ]
  },
  {
    id: "animals",
    name: "Animals",
    tag: "ANIMAL",
    wordCount: 40,
    description: "Wild cats, domestic pets, and common farm creatures.",
    words: [
      "Lion", "Tiger", "Elephant", "Monkey", "Dog",
      "Cat", "Horse", "Cow", "Buffalo", "Snake",
      "Rabbit", "Bear", "Fox", "Wolf", "Camel",
      "Goat", "Hen", "Eagle", "Parrot", "Fish",
      "Giraffe", "Zebra", "Kangaroo", "Panda", "Koala",
      "Deer", "Squirrel", "Leopard", "Cheetah", "Shark",
      "Dolphin", "Whale", "Octopus", "Owl", "Penguin",
      "Duck", "Frog", "Crocodile", "Turtle", "Butterfly"
    ]
  },
  {
    id: "vehicles",
    name: "Vehicles",
    tag: "VEHICLES",
    wordCount: 40,
    description: "Trains, cycles, tractors, and emergency engines.",
    words: [
      "Car", "Bike", "Bus", "Truck", "Train",
      "Metro", "Plane", "Helicopter", "Boat", "Ship",
      "Scooter", "Auto", "Cycle", "Tractor", "Ambulance",
      "Police Car", "Fire Truck", "Taxi", "Rickshaw", "Bulldozer",
      "Sports Car", "Convertible", "Limousine", "SUV", "Van",
      "Minivan", "Cargo Ship", "Submarine", "Yacht", "Hot Air Balloon",
      "Glider", "Space Shuttle", "Rocket", "Skateboard", "Segway",
      "Forklift", "Crane", "Cement Mixer", "Garbage Truck", "Golf Cart"
    ]
  },
  {
    id: "tech",
    name: "Tech",
    tag: "TECH",
    wordCount: 40,
    description: "Smartphones, chargers, wifi routers, and AI services.",
    words: [
      "Phone", "Laptop", "Computer", "Keyboard", "Mouse",
      "Monitor", "WiFi", "Bluetooth", "Camera", "Charger",
      "Power Bank", "Headphones", "Smartwatch", "Instagram", "YouTube",
      "Google", "ChatGPT", "Netflix", "USB", "Printer",
      "AI", "Robot", "Virtual Reality", "Augmented Reality", "Server",
      "Database", "Cloud", "App", "Website", "Domain",
      "IP Address", "Router", "Modem", "Ethernet", "Sim Card",
      "Microchip", "Processor", "RAM", "Hard Drive", "Software"
    ]
  },
  {
    id: "jobs",
    name: "Jobs",
    tag: "JOBS",
    wordCount: 40,
    description: "Doctors, pilots, chefs, and daily professions.",
    words: [
      "Doctor", "Engineer", "Teacher", "Police", "Lawyer",
      "Pilot", "Chef", "Farmer", "Driver", "Singer",
      "Actor", "Plumber", "Electrician", "Soldier", "Judge",
      "Scientist", "Photographer", "Journalist", "Barber", "Mechanic",
      "Nurse", "Dentist", "Pharmacist", "Vet", "Architect",
      "Designer", "Programmer", "Writer", "Artist", "Musician",
      "Dancer", "Model", "Athlete", "Coach", "Manager",
      "Accountant", "Cashier", "Waiter", "Receptionist", "Security Guard"
    ]
  },
  {
    id: "brands",
    name: "Brands",
    tag: "BRANDS",
    wordCount: 40,
    description: "Global fashion, fast food chains, and local operators.",
    words: [
      "Apple", "Samsung", "Nike", "Adidas", "Puma",
      "Amazon", "Flipkart", "Zomato", "Swiggy", "Jio",
      "Airtel", "Coca-Cola", "Pepsi", "McDonald's", "KFC",
      "Domino's", "BMW", "Mercedes", "Toyota", "Tata",
      "Microsoft", "Google", "Sony", "Nintendo", "Intel",
      "Dell", "HP", "Lenovo", "Asus", "Netflix",
      "Spotify", "Uber", "Ola", "Starbucks", "Subway",
      "Pizza Hut", "Honda", "Hyundai", "Audi", "Ferrari"
    ]
  },
  {
    id: "daily-life",
    name: "Daily Life",
    tag: "DAILY",
    wordCount: 40,
    description: "Alarms, toothbrush scrubs, AC remotes, and door keys.",
    words: [
      "Alarm", "Wallet", "Money", "UPI", "ATM",
      "Fan", "AC", "Mirror", "Toothbrush", "Soap",
      "Shampoo", "Towel", "Bed", "Pillow", "Chair",
      "Bottle", "Clock", "Door", "Window", "Key",
      "Calendar", "Notebook", "Pen", "Pencil", "Eraser",
      "Scissors", "Tape", "Umbrella", "Bag", "Shoes",
      "Socks", "Slippers", "Comb", "Perfume", "Deodorant",
      "Glasses", "Watch", "Ring", "Keychain", "Charger Cable"
    ]
  }
];

export const PACK_META: PackMeta[] = PACKS.map(({ words: _w, ...meta }) => meta);

export function findPack(id: string): PackData | undefined {
  return PACKS.find((p) => p.id === id);
}
