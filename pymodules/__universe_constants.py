# pymodules/__universe_constants.py


class PhysicalConstants:
    def __init__(
        self,
        speed_of_light=299792458,
        gravitational_constant=6.67430e-11,
        planck_constant=6.62607015e-34,
        fine_structure_constant=1 / 137,
        earth_mass=5.972e24,  # Masa de la Tierra en kg
        earth_diameter=12742,  # Diámetro de la Tierra en km
        sun_mass=1.989e30,  # Masa del Sol en kg
        tidal_dissipation_number=100,  # Q_PLANET, número de disipación tidal
        love_number=0.3,  # K2_PLANET, número de Love
        
        # Moon generation parameters
        moon_density_rocky=3000,  # kg/m³ for rocky satellites
        moon_density_icy=1000,  # kg/m³ for icy satellites
        roche_coefficient_fluid=2.456,  # Roche limit coefficient for fluid bodies
        hill_sphere_stability_factor=0.4,  # Maximum stable orbit fraction of Hill sphere
        moon_separation_factor=3.5,  # Minimum separation in mutual Hill radii
    ):
        self.c = speed_of_light  # Velocidad de la luz (m/s)
        self.G = gravitational_constant  # Constante de gravitación universal (m^3 kg^-1 s^-2)
        self.h = planck_constant  # Constante de Planck (J·s)
        self.alpha = fine_structure_constant  # Constante de estructura fina
        self.M_EARTH = earth_mass  # Masa de la Tierra
        self.D_EARTH = earth_diameter  # Diámetro de la Tierra
        self.M_SUN = sun_mass  # Masa del Sol
        self.Q_PLANET = tidal_dissipation_number  # Número de disipación tidal (Q)
        self.K2_PLANET = love_number  # Número de Love (K2)

        # Moon generation constants
        self.MOON_DENSITY_ROCKY = moon_density_rocky
        self.MOON_DENSITY_ICY = moon_density_icy
        self.ROCHE_COEFFICIENT = roche_coefficient_fluid
        self.HILL_STABILITY_FACTOR = hill_sphere_stability_factor
        self.MOON_SEPARATION_FACTOR = moon_separation_factor

    def update_constants(
        self,
        speed_of_light=None,
        gravitational_constant=None,
        planck_constant=None,
        fine_structure_constant=None,
        earth_mass=None,
        earth_diameter=None,
        sun_mass=None,
        tidal_dissipation_number=None,
        love_number=None,
        moon_density_rocky=None,
        moon_density_icy=None,
        roche_coefficient_fluid=None,
        hill_sphere_stability_factor=None,
        moon_separation_factor=None,
    ):
        if speed_of_light is not None:
            self.c = speed_of_light
        if gravitational_constant is not None:
            self.G = gravitational_constant
        if planck_constant is not None:
            self.h = planck_constant
        if fine_structure_constant is not None:
            self.alpha = fine_structure_constant
        if earth_mass is not None:
            self.M_EARTH = earth_mass
        if earth_diameter is not None:
            self.D_EARTH = earth_diameter
        if sun_mass is not None:
            self.M_SUN = sun_mass
        if tidal_dissipation_number is not None:
            self.Q_PLANET = tidal_dissipation_number
        if love_number is not None:
            self.K2_PLANET = love_number
        if moon_density_rocky is not None:
            self.MOON_DENSITY_ROCKY = moon_density_rocky
        if moon_density_icy is not None:
            self.MOON_DENSITY_ICY = moon_density_icy
        if roche_coefficient_fluid is not None:
            self.ROCHE_COEFFICIENT = roche_coefficient_fluid
        if hill_sphere_stability_factor is not None:
            self.HILL_STABILITY_FACTOR = hill_sphere_stability_factor
        if moon_separation_factor is not None:
            self.MOON_SEPARATION_FACTOR = moon_separation_factor
