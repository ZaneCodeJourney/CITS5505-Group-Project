import unittest
import time
import json
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from app import create_app, db
from app.models import User, Dive, Share
from config import Config
import flask_login
from flask_login import LoginManager
from flask import session

class TestConfig(Config):
    """测试配置"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SECRET_KEY = 'test-key-for-csrf'
    SERVER_NAME = 'localhost:5050'

class ShareFunctionalityTest(unittest.TestCase):
    """结合API调用和Selenium的Share功能测试"""
    
    @classmethod
    def setUpClass(cls):
        """设置测试环境"""
        # 创建Chrome浏览器
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        cls.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        
        # 创建Flask应用和测试数据库
        cls.app = create_app(TestConfig)
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        cls.client = cls.app.test_client()
        
        # 创建数据库
        db.create_all()
        
        # 创建测试用户
        cls.test_user = User(
            username='testuser',
            email='test@example.com',
            firstname='Test',
            lastname='User',
            registration_date=datetime.utcnow(),
            status='active'
        )
        cls.test_user.set_password('Password123')
        
        cls.recipient = User(
            username='recipient',
            email='recipient@example.com',
            firstname='Share',
            lastname='Recipient',
            registration_date=datetime.utcnow(),
            status='active'
        )
        cls.recipient.set_password('Password123')
        
        db.session.add(cls.test_user)
        db.session.add(cls.recipient)
        db.session.commit()
        
        # 创建测试潜水记录
        cls.dive1 = Dive(
            user_id=cls.test_user.id,
            dive_number=1,
            start_time=datetime.utcnow() - timedelta(days=3),
            end_time=datetime.utcnow() - timedelta(days=3) + timedelta(hours=1),
            max_depth=18.5,
            location='Great Barrier Reef',
            visibility='Excellent',
            weather='Sunny',
            notes='Amazing coral formations'
        )
        
        cls.dive2 = Dive(
            user_id=cls.test_user.id,
            dive_number=2,
            start_time=datetime.utcnow() - timedelta(days=1),
            end_time=datetime.utcnow() - timedelta(days=1) + timedelta(hours=1, minutes=30),
            max_depth=22.0,
            location='Blue Hole',
            visibility='Good',
            weather='Partly Cloudy',
            notes='Deep dive with interesting formations'
        )
        
        db.session.add(cls.dive1)
        db.session.add(cls.dive2)
        db.session.commit()
    
        # 在单独线程中启动Flask应用
        def start_flask():
            cls.app.run(host='127.0.0.1', port=5050, use_reloader=False)
        
        import threading
        cls.flask_thread = threading.Thread(target=start_flask)
        cls.flask_thread.daemon = True
        cls.flask_thread.start()
        
        # 等待服务器启动
        time.sleep(2)
    
    @classmethod
    def tearDownClass(cls):
        """清理测试环境"""
        cls.driver.quit()
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()
    
    def tearDown(self):
        """每个测试后的清理"""
        # 清除所有分享记录（保留初始数据）
        Share.query.delete()
        db.session.commit()
    
    def create_session_for_user(self, user_id):
        """创建测试用户的会话"""
        with self.app.test_request_context():
            user = User.query.get(user_id)
            flask_login.login_user(user)
            # 保存会话数据
            return dict(session)
    
    def login_api(self, email, password, client=None):
        """API登录方法"""
        if client is None:
            client = self.client
        
        # 获取用户ID
        user = User.query.filter_by(email=email).first()
        if not user:
            raise ValueError(f"找不到邮箱为 {email} 的用户")
            
        session_data = self.create_session_for_user(user.id)
        
        # 创建一个新客户端实例，该实例有会话状态
        client = self.app.test_client()
        with client.session_transaction() as sess:
            for key, value in session_data.items():
                sess[key] = value
        
        # 测试是否正确登录
        response = client.get('/my-logs')
        self.assertEqual(response.status_code, 200)
        
        return client
    
    def test_01_api_share_with_user(self):
        """测试：API分享潜水日志给特定用户"""
        print("\n测试：API分享潜水日志给特定用户")
        
        # 登录测试用户
        client = self.login_api('test@example.com', 'Password123')
        
        # 使用API分享潜水日志
        share_response = client.post(
            f'/api/shared/dives/{self.dive1.id}/share-with-user',
            json={'username': 'recipient'},
            headers={'Content-Type': 'application/json'}
        )
        
        # 打印响应内容以进行调试
        print(f"API响应: {share_response.status_code}")
        print(f"响应内容: {share_response.data.decode('utf-8')}")
        
        # 检查API响应
        self.assertEqual(share_response.status_code, 201)
        response_data = json.loads(share_response.data)
        self.assertIn('success', response_data)
        
        # 验证分享记录已创建
        share = Share.query.filter_by(
            dive_id=self.dive1.id,
            creator_user_id=self.test_user.id,
            shared_with_user_id=self.recipient.id
        ).first()
        
        self.assertIsNotNone(share)
        print("✓ API分享成功创建")
        
        # 使用Selenium查看分享界面元素
        try:
            # 这里使用正确的端口
            self.driver.get('http://localhost:5050/auth/login')
            
            # 截图登录页面
            self.driver.save_screenshot('login_page.png')
            
            print("✓ 成功加载登录页面")
        except Exception as e:
            print(f"× Selenium测试失败: {e}")
    
    def test_02_api_create_public_link(self):
        """测试：API创建公共分享链接"""
        print("\n测试：API创建公共分享链接")
        
        # 登录测试用户
        client = self.login_api('test@example.com', 'Password123')
        
        # 使用API创建公共链接
        share_response = client.post(
            f'/api/shared/dives/{self.dive2.id}/share',
            json={'expiration_days': 7},
            headers={'Content-Type': 'application/json'}
        )
        
        # 检查API响应
        self.assertEqual(share_response.status_code, 201)
        data = json.loads(share_response.data)
        self.assertIn('share_link', data)
        self.assertIn('token', data)
        
        # 验证分享记录已创建
        share = Share.query.filter_by(
            dive_id=self.dive2.id,
            creator_user_id=self.test_user.id,
            visibility='public'
        ).first()
        
        self.assertIsNotNone(share)
        print(f"✓ 公共分享链接成功创建: {data['share_link']}")
    
    def test_03_api_share_with_nonexistent_user(self):
        """测试：API分享给不存在的用户"""
        print("\n测试：API分享给不存在的用户")
        
        # 登录测试用户
        client = self.login_api('test@example.com', 'Password123')
        
        # 使用API分享给不存在的用户
        share_response = client.post(
            f'/api/shared/dives/{self.dive1.id}/share-with-user',
            json={'username': 'nonexistentuser'},
            headers={'Content-Type': 'application/json'}
        )
        
        # 检查API响应
        self.assertEqual(share_response.status_code, 404)
        data = json.loads(share_response.data)
        self.assertIn('error', data)
        print(f"✓ API正确返回404错误: {data['error']}")
    
    def test_04_api_recipient_view_shared(self):
        """测试：接收者查看分享给他的潜水日志"""
        print("\n测试：接收者查看分享给他的潜水日志")
        
        # 创建分享记录
        share = Share(
            dive_id=self.dive1.id,
            creator_user_id=self.test_user.id,
            shared_with_user_id=self.recipient.id,
            token='test-token-123',
            visibility='user_specific',
            created_at=datetime.utcnow()
        )
        db.session.add(share)
        db.session.commit()
        
        # 登录接收者
        client = self.login_api('recipient@example.com', 'Password123')
        
        # 验证数据库中的分享记录
        with self.app.app_context():
            # 查询分享给接收者的潜水记录
            shared_dives = db.session.query(Dive).\
                join(Share, Dive.id == Share.dive_id).\
                filter(Share.shared_with_user_id == self.recipient.id).\
                all()
            
            self.assertEqual(len(shared_dives), 1)
            self.assertEqual(shared_dives[0].id, self.dive1.id)
            self.assertEqual(shared_dives[0].location, 'Great Barrier Reef')
            
            print(f"✓ 接收者可以看到分享给他的潜水记录: {shared_dives[0].location}")
            
            # 尝试访问Shared with me页面
            response = client.get('/api/shared/shared-with-me')
            self.assertEqual(response.status_code, 200)
            print("✓ 接收者可以访问Shared with me页面")
    
    def test_05_api_authentication_required(self):
        """测试：API需要认证"""
        print("\n测试：API需要认证")
        
        # 创建一个新的没有会话的客户端
        unauthenticated_client = self.app.test_client()
        
        # 不登录，直接尝试分享
        share_response = unauthenticated_client.post(
            f'/api/shared/dives/{self.dive1.id}/share-with-user',
            json={'username': 'recipient'},
            headers={'Content-Type': 'application/json'}
        )
        
        # 应该返回401或302（重定向到登录页面）
        self.assertIn(share_response.status_code, [401, 302, 403])
        print(f"✓ API正确阻止未认证的请求 (返回码: {share_response.status_code})")
        
        # 检查是否包含登录相关的重定向或错误消息
        if share_response.status_code == 302:
            location = share_response.headers.get('Location', '')
            self.assertIn('/auth/login', location)
            print(f"✓ 正确重定向到登录页面: {location}")
        else:
            data = json.loads(share_response.data)
            self.assertIn('error', data)
            print(f"✓ 返回正确的错误消息: {data['error']}")

if __name__ == '__main__':
    unittest.main() 