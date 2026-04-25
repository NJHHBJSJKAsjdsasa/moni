import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.abspath('/workspace'))

from pymodules.__universe_init_solarsystem import SolarSystem
from pymodules.__universe_constants import PhysicalConstants

# 测试 1: 测试 SolarSystem 的 get_planet 方法处理超出范围的索引
def test_get_planet_out_of_range():
    print("测试 1: 测试 SolarSystem 的 get_planet 方法处理超出范围的索引")
    constants = PhysicalConstants()
    system = SolarSystem(seed=123, index=0, constants=constants)
    
    print(f"系统实际行星数量: {system.num_planets}")
    
    # 测试超出范围的索引
    for i in range(system.num_planets, system.num_planets + 5):
        planet = system.get_planet(i)
        print(f"索引 {i}: {planet}")
        assert planet is None, f"索引 {i} 应该返回 None"
    
    print("测试 1 通过: get_planet 方法正确处理超出范围的索引\n")

if __name__ == "__main__":
    test_get_planet_out_of_range()
    print("所有测试通过！")
