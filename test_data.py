from app import create_app, db
from app.models import User, Site, SharkWarning
from datetime import datetime, timedelta
import random
import os

app = create_app()

def create_test_data():
    with app.app_context():
        # 确保上传文件夹存在
        upload_folder = os.path.join(app.static_folder, 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        # 创建测试用户
        user1 = User(
            username='testuser',
            email='test@example.com',
            firstname='Test',
            lastname='User',
            date_of_birth=datetime(1990, 1, 1)
        )
        user1.set_password('password')
        
        user2 = User(
            username='diver1',
            email='diver1@example.com',
            firstname='Dive',
            lastname='Master',
            date_of_birth=datetime(1985, 5, 15)
        )
        user2.set_password('password')
        
        db.session.add(user1)
        db.session.add(user2)
        
        # 创建测试潜水站点
        sites = [
            Site(
                name='Coral Bay',
                description='Beautiful coral reef with diverse marine life',
                location='Australia',
                latitude=-23.1333,
                longitude=113.7667
            ),
            Site(
                name='Blue Hole',
                description='Famous deep blue sinkhole',
                location='Belize',
                latitude=17.3164,
                longitude=-87.5339
            ),
            Site(
                name='Great Barrier Reef',
                description='World\'s largest coral reef system',
                location='Australia',
                latitude=-18.2871,
                longitude=147.6992
            ),
            Site(
                name='Sipadan Island',
                description='Pristine diving location known for large pelagic species',
                location='Malaysia',
                latitude=4.1147,
                longitude=118.6265
            )
        ]
        
        for site in sites:
            db.session.add(site)
        
        # 提交以获取ID
        db.session.commit()
        
        # 创建测试鲨鱼警告
        shark_species = ['Great White', 'Tiger Shark', 'Bull Shark', 'Hammerhead', 'Whale Shark', 'Unknown']
        severity_levels = ['low', 'medium', 'high']
        statuses = ['active', 'resolved', 'expired']
        
        for i in range(10):
            days_ago = random.randint(0, 30)
            sighting_time = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
            
            warning = SharkWarning(
                site_id=random.choice(sites).id,
                reporter_id=random.choice([user1.id, user2.id]),
                species=random.choice(shark_species),
                size_estimate=f"{random.randint(1, 6)} meters",
                sighting_time=sighting_time,
                report_time=sighting_time + timedelta(minutes=random.randint(15, 120)),
                severity=random.choice(severity_levels),
                description=f"Shark was spotted at {random.randint(5, 30)} meters depth, " 
                           f"{'swimming calmly' if random.random() > 0.5 else 'showing aggressive behavior'}.",
                status=random.choice(statuses)
            )
            
            db.session.add(warning)
        
        db.session.commit()
        
        print("Test data created successfully!")

if __name__ == '__main__':
    create_test_data() 