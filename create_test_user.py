from app import create_app, db
from app.models import User
from datetime import datetime

def create_test_user():
    app = create_app()
    
    with app.app_context():
        # 检查用户是否已存在
        existing_user = User.query.filter_by(email='test@example.com').first()
        if existing_user:
            print('测试用户已存在。')
            return
            
        # 创建测试用户
        test_user = User(
            username='testuser',
            email='test@example.com',
            firstname='Test',
            lastname='User',
            date_of_birth=datetime(1990, 1, 1),
            created_at=datetime.utcnow(),
            is_active=True,
            bio='这是一个测试账户',
            registration_date=datetime.utcnow(),
            avatar='https://via.placeholder.com/150',
            status='active'
        )
        
        # 设置密码
        test_user.set_password('password123')
        
        # 添加到数据库
        db.session.add(test_user)
        db.session.commit()
        
        print('测试用户创建成功。')
        print('Email: test@example.com')
        print('Password: password123')

if __name__ == '__main__':
    create_test_user() 