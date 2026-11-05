"""
Seed 10 distinct, realistic cold-start volunteer personas into backend/volunteer.db.
Provides diverse testing queries across causes, populations, regions, durations, and skills.
CSIT5210 Group 1 Project.
"""

import sqlite3
import json
from backend.services.user_service import generate_profile_text

PERSONAS = [
    {
        "id": "user_1",
        "name": "Sarah Chan (Animal Welfare)",
        "email": "user1@connect.ust.hk",
        "bio": "Passionate animal lover eager to help rescue shelters, dog adoption centres, and animal care.",
        "preferred_causes": ["Animal Welfare"],
        "target_populations": ["Animals"],
        "preferred_regions": ["Hong Kong Island", "New Territories"],
        "skills": ["Cantonese", "First Aid"],
        "max_duration_hours": 6.0,
    },
    {
        "id": "user_2",
        "name": "David Wong (Elderly Care)",
        "email": "user2@connect.ust.hk",
        "bio": "Enjoys chatting with the elderly, delivering warm meals, and promoting wellness among seniors.",
        "preferred_causes": ["Health & Wellness", "Support and assistance"],
        "target_populations": ["Elderly"],
        "preferred_regions": ["Kowloon"],
        "skills": ["Cantonese"],
        "max_duration_hours": 2.0,
    },
    {
        "id": "user_3",
        "name": "Emily Watson (Youth Tutoring)",
        "email": "user3@connect.ust.hk",
        "bio": "University student dedicated to helping primary school pupils and underprivileged children with homework.",
        "preferred_causes": ["Education"],
        "target_populations": ["Children and Youth"],
        "preferred_regions": ["New Territories"],
        "skills": ["English"],
        "max_duration_hours": 2.5,
    },
    {
        "id": "user_4",
        "name": "Michael Lee (Food Rescue & Hunger)",
        "email": "user4@connect.ust.hk",
        "bio": "Passionate about reducing food waste and distributing fresh produce/hot meals to low-income families.",
        "preferred_causes": ["Food Assistance", "Hunger & Homelessness"],
        "target_populations": ["Low income households", "People experiencing homelessness"],
        "preferred_regions": ["Hong Kong Island"],
        "skills": ["Cantonese"],
        "max_duration_hours": 2.0,
    },
    {
        "id": "user_5",
        "name": "Chloe Cheung (Disability Inclusion & Arts)",
        "email": "user5@connect.ust.hk",
        "bio": "Art enthusiast keen on assisting art classes and fitness workshops for individuals with physical disabilities.",
        "preferred_causes": ["Support and assistance", "Health & Wellness"],
        "target_populations": ["People with physical disabilities"],
        "preferred_regions": ["Kowloon"],
        "skills": ["Cantonese"],
        "max_duration_hours": 2.0,
    },
    {
        "id": "user_6",
        "name": "Amina Khan (Ethnic Minorities & Refugees)",
        "email": "user6@connect.ust.hk",
        "bio": "Bilingual volunteer supporting integration, cultural exchange, and schoolwork for ethnic minority children.",
        "preferred_causes": ["Education", "Support and assistance"],
        "target_populations": ["Ethnic minorities", "Children and Youth"],
        "preferred_regions": ["New Territories"],
        "skills": ["English", "Cantonese"],
        "max_duration_hours": 3.0,
    },
    {
        "id": "user_7",
        "name": "Kelvin Ho (Environmental Conservation)",
        "email": "user7@connect.ust.hk",
        "bio": "Passionate environmentalist interested in beach cleanups, plastic recycling, and circular economy clothing sort.",
        "preferred_causes": ["Environmental Conservation", "Waste Reduction"],
        "target_populations": ["Low income households"],
        "preferred_regions": ["New Territories"],
        "skills": ["Cantonese"],
        "max_duration_hours": 3.5,
    },
    {
        "id": "user_8",
        "name": "Jessica Lau (Family Health & Community)",
        "email": "user8@connect.ust.hk",
        "bio": "Wants to support community health sessions and provide emotional and practical support for vulnerable families.",
        "preferred_causes": ["Health & Wellness"],
        "target_populations": ["Families", "Children and Youth"],
        "preferred_regions": ["Hong Kong Island"],
        "skills": ["Cantonese"],
        "max_duration_hours": 2.0,
    },
    {
        "id": "user_9",
        "name": "Brian Tsang (Special Educational Needs)",
        "email": "user9@connect.ust.hk",
        "bio": "Patient volunteer interested in sensory workshops and interactive learning for children with special educational needs.",
        "preferred_causes": ["Education", "Support and assistance"],
        "target_populations": ["People with special educational needs"],
        "preferred_regions": ["Kowloon"],
        "skills": ["Cantonese"],
        "max_duration_hours": 2.5,
    },
    {
        "id": "user_10",
        "name": "Alex Wong (Homeless Outreach & Rapid Relief)",
        "email": "user10@connect.ust.hk",
        "bio": "Night outreach volunteer providing hot food, winter clothing, and hygiene packs to rough sleepers across HK.",
        "preferred_causes": ["Food Assistance", "Hunger & Homelessness"],
        "target_populations": ["People experiencing homelessness"],
        "preferred_regions": ["Kowloon"],
        "skills": ["Cantonese"],
        "max_duration_hours": 1.75,
    },
]


def seed_personas():
    conn = sqlite3.connect("backend/volunteer.db")
    c = conn.cursor()

    for p in PERSONAS:
        profile_text = generate_profile_text(
            name=p["name"],
            bio=p["bio"],
            causes=p["preferred_causes"],
            pops=p["target_populations"],
            regions=p["preferred_regions"],
            skills=p["skills"],
            max_hours=p["max_duration_hours"]
        )

        c.execute("""
            UPDATE users SET
                name = ?,
                bio = ?,
                preferred_causes = ?,
                target_populations = ?,
                preferred_regions = ?,
                skills = ?,
                max_duration_hours = ?,
                profile_text = ?
            WHERE id = ?
        """, (
            p["name"],
            p["bio"],
            json.dumps(p["preferred_causes"]),
            json.dumps(p["target_populations"]),
            json.dumps(p["preferred_regions"]),
            json.dumps(p["skills"]),
            p["max_duration_hours"],
            profile_text,
            p["id"]
        ))
        print(f"✅ Updated {p['id']}: {p['name']}")

    conn.commit()
    conn.close()
    print("✨ Successfully seeded all 10 cold-start test personas!")


if __name__ == "__main__":
    seed_personas()
