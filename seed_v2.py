#!/usr/bin/env python
"""
seed_v2.py
-----------
Completely rebuild the database with demo-friendly data.
Differences vs original seed.py:
1. Adds extra users (aadil, kevin, jiaoo, zane).
2. Generates sites **without** thumbnail images (so front-end can apply placeholders).
3. Omits reviews entirely (cleaner demo).
4. Uses iNaturalist API to fetch real taxon IDs (so image look-ups work later).
5. Every dive location string contains lat/lng so the heat-map works.
6. Dive profile CSV includes Air (bar) column.
7. Populates DiveSpecies for each dive.
8. Shares logic identical to original (demo user shares widely, others share at least one dive per user).
9. Still adds a few SharkWarnings.
Running this file **will wipe existing data**.
"""
import os
import sys
import csv
import io
import uuid
import random
import traceback
from datetime import datetime, timedelta, date

import requests
from werkzeug.security import generate_password_hash

# Make project importable when run directly
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models import (
    User,
    Dive,
    Site,
    Share,
    SharkWarning,
    DiveSpecies,
)

app = create_app()

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def random_date(start: datetime, end: datetime) -> datetime:
    """Return a random datetime between *start* and *end*."""
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))


def generate_token() -> str:
    return str(uuid.uuid4())

# ---------------------------------------------------------------------------
# iNaturalist helpers — keep the script deterministic by caching responses
# ---------------------------------------------------------------------------

_INAT_CACHE = {}


def inat_search(query: str, n: int = 5, locale: str = "en"):
    """Return a list of taxa dictionaries from iNaturalist for *query*."""
    cache_key = (query, n, locale)
    if cache_key in _INAT_CACHE:
        return _INAT_CACHE[cache_key]

    url = "https://api.inaturalist.org/v1/taxa"
    try:
        resp = requests.get(
            url,
            params={"q": query, "rank": "species", "per_page": n, "locale": locale},
            timeout=10,
        )
        resp.raise_for_status()
        taxa = [
            {
                "taxon_id": t["id"],
                "scientific_name": t["name"],
                "common_name": t.get("preferred_common_name"),
                "rank": t["rank"],
            }
            for t in resp.json().get("results", [])
        ]
    except Exception as exc:  # noqa: BLE001, S110
        print(f"[WARN] inat_search failed for '{query}': {exc}")
        taxa = []

    _INAT_CACHE[cache_key] = taxa
    return taxa

# ---------------------------------------------------------------------------
# CSV generator with Air column
# ---------------------------------------------------------------------------

def generate_dive_profile_csv() -> str:
    """Return CSV string with Time, Depth, Air, Temperature columns."""
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["Time (min)", "Depth (m)", "Air (bar)", "Temperature (°C)"])

    max_depth = random.uniform(12.0, 35.0)
    total_time = random.randint(35, 65)
    surface_temp = random.uniform(18.0, 28.0)
    starting_air = random.randint(200, 220)
    ending_air = random.randint(50, 80)
    air_rate = (starting_air - ending_air) / total_time

    # Simple descent-bottom-ascent model
    descent_time = max(3, int(max_depth / 10))
    bottom_time = total_time - descent_time - 8  # 8 ≈ ascent + safety stop

    # Descent
    for minute in range(descent_time):
        depth = (minute + 1) / descent_time * max_depth
        temp = surface_temp - depth * 0.15
        air = starting_air - air_rate * minute * 1.4
        writer.writerow([minute, round(depth, 1), round(air, 1), round(temp, 1)])

    # Bottom
    for minute in range(descent_time, descent_time + bottom_time):
        depth_variance = random.uniform(-2, 2)
        depth = max(1.0, max_depth + depth_variance)
        temp = surface_temp - depth * 0.15
        air = starting_air - air_rate * minute
        writer.writerow([minute, round(depth, 1), round(air, 1), round(temp, 1)])

    # Ascent + safety stop at ~5 m for 3 min
    ascent_start = descent_time + bottom_time
    for minute_offset in range(8):
        minute = ascent_start + minute_offset
        if minute_offset < 5:
            # Linear ascent to 5 m
            depth = max_depth - (max_depth - 5) * (minute_offset / 5)
        else:
            depth = 5.0
        temp = surface_temp - depth * 0.15
        air = starting_air - air_rate * minute * 0.7
        writer.writerow([minute, round(depth, 1), round(air, 1), round(temp, 1)])

    return out.getvalue()

# ---------------------------------------------------------------------------
# Database reset helpers
# ---------------------------------------------------------------------------

def wipe_data():
    """Delete all rows from every model we seed."""
    for model in (Share, SharkWarning, DiveSpecies, Dive, Site, User):
        model.query.delete()
    db.session.commit()

# ---------------------------------------------------------------------------
# Seed routines
# ---------------------------------------------------------------------------

USERS = [
    # username, firstname, lastname, email
    ("johndoe", "John", "Doe", "john@example.com"),
    ("janediver", "Jane", "Smith", "jane@example.com"),
    ("mikeocean", "Mike", "Ocean", "mike@example.com"),
    ("sarahsea", "Sarah", "Sea", "sarah@example.com"),
    ("demo", "Demo", "User", "demo@example.com"),
    ("aadil", "Aadil", "Vagh", "aadil@example.com"),
    ("kevin", "Kevin", "Ng", "kevin@example.com"),
    ("jiaoo", "Jiaoo", "Chen", "jiaoo@example.com"),
    ("zane", "Zane", "Lee", "zane@example.com"),
]

# Dive sites (thumbnail_url intentionally None)
SITES = [
    {
        "name": "Great Barrier Reef",
        "description": "World's largest coral reef system.",
        "lat": -18.286130,
        "lng": 147.700050,
        "country": "Australia",
        "region": "Queensland",
        "avg_visibility": "Excellent (15-30m)",
        "avg_depth": 25.0,
        "difficulty": "Intermediate",
        "best_season": "June to October",
    },
    {
        "name": "Blue Hole",
        "description": "Giant marine sinkhole off Belize.",
        "lat": 17.316030,
        "lng": -87.535090,
        "country": "Belize",
        "region": "Lighthouse Reef",
        "avg_visibility": "Excellent (30m+)",
        "avg_depth": 40.0,
        "difficulty": "Advanced",
        "best_season": "April to June",
    },
    {
        "name": "Raja Ampat",
        "description": "Coral paradise in Indonesia.",
        "lat": -0.789275,
        "lng": 130.735321,
        "country": "Indonesia",
        "region": "West Papua",
        "avg_visibility": "Good (10-20m)",
        "avg_depth": 20.0,
        "difficulty": "Intermediate",
        "best_season": "October to April",
    },
    {
        "name": "Ningaloo Reef",
        "description": "Fringing reef famed for whale sharks.",
        "lat": -22.566667,
        "lng": 113.816667,
        "country": "Australia",
        "region": "Western Australia",
        "avg_visibility": "Excellent (15-25m)",
        "avg_depth": 20.0,
        "difficulty": "Beginner to Advanced",
        "best_season": "March to August",
    },
    {
        "name": "Rottnest Island",
        "description": "Limestone reefs off Perth coast.",
        "lat": -32.006111,
        "lng": 115.513889,
        "country": "Australia",
        "region": "Western Australia",
        "avg_visibility": "Good (10-20m)",
        "avg_depth": 18.0,
        "difficulty": "Beginner to Intermediate",
        "best_season": "March to May",
    },
]

SPECIES_KEYWORDS = [
    "grey shark",
    "sea turtle",
    "white shark",
    "manta ray",
    "nudibranch",
    "octopus",
    "trigger fish",
    "anemone fish"
]

# ---------------------------------------------------------------------------
# Main seeding logic
# ---------------------------------------------------------------------------

def seed():
    with app.app_context():
        print("Wiping existing data…")
        wipe_data()

        # -------------------------------------------------------------------
        # Users
        # -------------------------------------------------------------------
        user_objs = {}
        print("Creating users…")
        for username, firstname, lastname, email in USERS:
            user = User(
                username=username,
                firstname=firstname,
                lastname=lastname,
                email=email,
                bio="Auto-generated demo user.",
                dob=date(1990, 1, 1),
                password_hash=generate_password_hash("Password123!"),
                registration_date=datetime.utcnow(),
                status="active",
            )
            db.session.add(user)
            user_objs[username] = user
        db.session.commit()
        print(f"  → {len(user_objs)} users created")

        # -------------------------------------------------------------------
        # Sites
        # -------------------------------------------------------------------
        site_objs = {}
        print("Creating dive sites…")
        for data in SITES:
            site = Site(
                name=data["name"],
                description=data["description"],
                lat=data["lat"],
                lng=data["lng"],
                country=data["country"],
                region=data["region"],
                avg_visibility=data["avg_visibility"],
                avg_depth=data["avg_depth"],
                difficulty=data["difficulty"],
                best_season=data["best_season"],
                thumbnail_url=None,
                created_at=datetime.utcnow(),
            )
            db.session.add(site)
            site_objs[data["name"]] = site
        db.session.commit()
        print(f"  → {len(site_objs)} sites created")

        # -------------------------------------------------------------------
        # Build species catalogue from API
        # -------------------------------------------------------------------
        print("Fetching species data from iNaturalist…")
        species_catalogue = []
        for kw in SPECIES_KEYWORDS:
            species_catalogue.extend(inat_search(kw, 3))
        print(f"  → {len(species_catalogue)} species fetched")
        if not species_catalogue:
            print("  ⚠ No species fetched – charts may be empty.")

        # -------------------------------------------------------------------
        # Generate dives
        # -------------------------------------------------------------------
        print("Generating dives…")
        demo_user = user_objs["demo"]
        dive_num_counter = 0

        start_date = datetime.utcnow() - timedelta(days=18 * 30)
        for month in range(18):
            month_date = start_date + timedelta(days=30 * month)
            for _ in range(random.randint(1, 3)):
                site = random.choice(list(site_objs.values()))
                dive_start = month_date.replace(
                    hour=random.randint(8, 16), minute=random.choice([0, 15, 30, 45])
                )
                duration = random.randint(30, 70)
                dive_end = dive_start + timedelta(minutes=duration)

                max_depth = random.uniform(12, 35)

                dive = Dive(
                    user_id=demo_user.id,
                    dive_number=dive_num_counter + 1,
                    start_time=dive_start,
                    end_time=dive_end,
                    max_depth=max_depth,
                    weight_belt=f"{random.randint(8, 14)} kg",
                    visibility=random.choice(["Excellent", "Good", "Fair"]),
                    weather=random.choice(["Sunny", "Partly Cloudy", "Cloudy"]),
                    location=f"{site.name} ({site.lat}, {site.lng})",
                    notes=f"Seeded dive at {site.name}.",
                    created_at=datetime.utcnow(),
                    suit_type=random.choice(["Wetsuit", "Shorty", "Drysuit"]),
                    suit_thickness=random.uniform(3, 7),
                    weight=random.uniform(8, 14),
                    tank_type=random.choice(["Aluminum", "Steel"]),
                    tank_size=random.choice([10, 12, 15]),
                    gas_mix=random.choice(["Air", "Nitrox"]),
                    o2_percentage=21,
                    profile_csv_data=generate_dive_profile_csv(),
                )
                db.session.add(dive)
                db.session.flush()  # to get dive.id

                # Attach species observations
                for sp in random.sample(species_catalogue, k=min(4, len(species_catalogue))):
                    ds = DiveSpecies(
                        dive_id=dive.id,
                        taxon_id=sp["taxon_id"],
                        scientific_name=sp["scientific_name"],
                        common_name=sp["common_name"],
                        rank=sp["rank"],
                    )
                    db.session.add(ds)

                dive_num_counter += 1
        db.session.commit()
        print(f"  → {dive_num_counter} dives for demo user created")

        # Other users – 3-5 dives each
        other_dive_counter = 0
        for username, user in user_objs.items():
            if username == "demo":
                continue
            for i in range(random.randint(3, 5)):
                site = random.choice(list(site_objs.values()))
                start = random_date(datetime.utcnow() - timedelta(days=365), datetime.utcnow())
                end = start + timedelta(minutes=random.randint(30, 80))

                dive = Dive(
                    user_id=user.id,
                    dive_number=i + 1,
                    start_time=start,
                    end_time=end,
                    max_depth=random.uniform(10, 40),
                    visibility=random.choice(["Excellent", "Good", "Fair"]),
                    weather=random.choice(["Sunny", "Cloudy", "Rain"]),
                    location=f"{site.name} ({site.lat}, {site.lng})",
                    notes="Seeded dive.",
                    created_at=datetime.utcnow(),
                    profile_csv_data=generate_dive_profile_csv(),
                )
                db.session.add(dive)
                db.session.flush()

                # species
                for sp in random.sample(species_catalogue, k=random.randint(2, 5)):
                    db.session.add(
                        DiveSpecies(
                            dive_id=dive.id,
                            taxon_id=sp["taxon_id"],
                            scientific_name=sp["scientific_name"],
                            common_name=sp["common_name"],
                            rank=sp["rank"],
                        )
                    )
                other_dive_counter += 1
        db.session.commit()
        print(f"  → {other_dive_counter} dives for other users created")

        # -------------------------------------------------------------------
        # Shares  (Cap ~5 incoming shares per user)
        # -------------------------------------------------------------------
        print("Creating limited shares (max 5 per user)…")

        # Build mapping of dives by owner
        dives_by_user = {}
        all_dives = Dive.query.all()
        for d in all_dives:
            dives_by_user.setdefault(d.user_id, []).append(d)

        share_count = 0

        for target_user in user_objs.values():
            # Exclude dives owned by the target_user
            candidate_dives = [d for d in all_dives if d.user_id != target_user.id]
            if not candidate_dives:
                continue

            k = min(random.randint(3, 5), len(candidate_dives))
            sampled_dives = random.sample(candidate_dives, k)

            for dive in sampled_dives:
                db.session.add(
                    Share(
                        dive_id=dive.id,
                        creator_user_id=dive.user_id,
                        shared_with_user_id=target_user.id,
                        token=generate_token(),
                        visibility="user_specific",
                        expiration_time=datetime.utcnow() + timedelta(days=30),
                        created_at=datetime.utcnow(),
                    )
                )
                share_count += 1

        # Add a handful of public shares from demo user for demonstration (3 dives)
        demo_dives_sample = random.sample(
            dives_by_user.get(demo_user.id, []), k=min(3, len(dives_by_user.get(demo_user.id, [])))
        )
        for dive in demo_dives_sample:
            db.session.add(
                Share(
                    dive_id=dive.id,
                    creator_user_id=demo_user.id,
                    token=generate_token(),
                    visibility="public",
                    expiration_time=datetime.utcnow() + timedelta(days=30),
                    created_at=datetime.utcnow(),
                )
            )
            share_count += 1

        db.session.commit()
        print(f"  → {share_count} shares created (≈4–5 per user)")

        # -------------------------------------------------------------------
        # Shark warnings (2 sites, 1-2 warnings each)
        # -------------------------------------------------------------------
        print("Adding shark warnings…")
        warning_count = 0
        sites_for_warning = random.sample(list(site_objs.values()), 2)
        for site in sites_for_warning:
            for _ in range(random.randint(1, 2)):
                user = random.choice(list(user_objs.values()))
                db.session.add(
                    SharkWarning(
                        site_id=site.id,
                        user_id=user.id,
                        species=random.choice(
                            ["Great White Shark", "Tiger Shark", "Bull Shark", "Hammerhead Shark"]
                        ),
                        size_estimate=f"{random.randint(2, 5)} metres",
                        description="Auto-seeded shark sighting.",
                        sighting_time=random_date(
                            datetime.utcnow() - timedelta(days=90), datetime.utcnow()
                        ),
                        severity=random.choice(["low", "medium", "high"]),
                        status="active",
                        created_at=datetime.utcnow(),
                    )
                )
                warning_count += 1
        db.session.commit()
        print(f"  → {warning_count} shark warnings added")

        print("Seeding complete ✔")


if __name__ == "__main__":
    try:
        seed()
    except Exception as exc:  # noqa: BLE001
        print("[ERROR] Seeding failed:", exc)
        traceback.print_exc()
        sys.exit(1)

# ---------------------------------------------------------------------------
# Backward-compatibility alias so legacy scripts can call seed_v2.create_sample_data
# ---------------------------------------------------------------------------

def create_sample_data():  # noqa: D401 – simple alias
    """Alias to run the full seeding routine (for reset_db_for_demo)."""
    seed() 