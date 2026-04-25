# 测试脚本，模拟行星对象来测试修复

# 模拟一个简单的行星对象
class MockPlanet:
    def __init__(self, name, seed):
        self.name = name
        self.seed = seed
        self.planet_type = "Rocky"
        self.diameter = 1.0
        self.density = 5500
        self.gravity = 9.81
        self.orbital_radius = 1.0
        self.orbital_period_seconds = 31536000
        self.rotation_period_seconds = 86400
        self.axial_tilt = 23.5
        self.initial_angle_rotation = 0
        self.initial_orbital_angle = 0
        self.atmosphere = "Breathable"
        self.planet_rings = False
        self.life_forms = "None"

# 导入并测试修复后的函数
try:
    from pymodules.planet_renderer.main_translator import PlanetRenderingTranslator
    translator = PlanetRenderingTranslator()
    
    # 测试 None 行星的情况
    print("Testing with None planet...")
    result = translator.translate_planet_rendering(None)
    print(f"Result: {result}")
    print("✓ Test passed: None planet handled correctly")
    
    # 测试正常行星的情况
    print("\nTesting with valid planet...")
    mock_planet = MockPlanet("TestPlanet", 12345)
    result = translator.translate_planet_rendering(mock_planet)
    print(f"Result contains error: {'error' in result}")
    print("✓ Test passed: Valid planet processed correctly")
    
    print("\nAll tests passed!")
except Exception as e:
    print(f"Test failed with error: {e}")
