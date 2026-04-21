import{S as g}from"./atlas_CyINvvA9z94U_VTNKIak4.js";import{D as b,a as D,g as N}from"./atlas_Bc7tCBLUzA7hEBl0iO9qx.js";import{V as d,C as c,i as _,co as I,av as h,au as P,bE as B,cr as L,B as k,a3 as z,ab as F,Y as O,bB as G,m as H}from"./atlas_CvLHNd-mv9CFAycOCNrF6.js";const e={STAR_COUNT:{min:4500,max:7500},MIN_BRIGHTNESS:{min:.6,max:.8},MAX_BRIGHTNESS:{min:.9,max:1},MIN_SIZE:{min:8,max:9.6},MAX_SIZE:{min:20,max:32},DISTANCE:{min:2e3,max:3600},TWINKLE_SPEED:{min:1,max:2},PARALLAX_STRENGTH:{min:1,max:3},VARIABLE_CHANCE:{min:.002,max:.005},ORBITAL_PARALLAX_STRENGTH:{min:.15,max:.35}};class u{starSystem;material;geometry;params;starCount;cameraPosition=new d;lastCameraPosition=new d;startTime;attenuationMesh;attenuationMaterial;attenuationGeometry;static vertexShader=`
    attribute float size;
    attribute float brightness;
    attribute float twinklePhase;
    attribute float starType;
    attribute float distanceLayer;
    attribute vec3 originalPosition;

    uniform float time;
    uniform float twinkleSpeed;
    uniform vec3 cameraOffset;
    uniform float parallaxStrength;
    uniform vec3 orbitalPosition;
    uniform float orbitalParallaxStrength;

    uniform float atmosphereRadius;
    uniform float uPlanetRadius;
    uniform float atmosphereDensity;

    varying float vBrightness;
    varying float vTwinkle;
    varying float vStarType;
    varying float vAtmoBlur;
    varying vec2 vTangentDir;

    void main() {
      vBrightness = brightness;
      vStarType = starType;
      vAtmoBlur = 0.0;
      vTangentDir = vec2(0.0);

      float baseTwinkle;
      if (starType > 0.5) {
        float pulse = sin(time * twinkleSpeed * 1.0 + twinklePhase);
        baseTwinkle = 0.2 + 0.8 * (pulse * 0.5 + 0.5);
      } else {
        float intensity = 0.05 + 0.05 * brightness;
        baseTwinkle = (1.0 - intensity) + intensity * sin(time * twinkleSpeed + twinklePhase);
      }

      vec3 parallaxOffset = cameraOffset * parallaxStrength * (0.5 / distanceLayer);
      vec3 orbitalParallax = orbitalPosition * orbitalParallaxStrength * (1.0 / distanceLayer);

      vec3 adjustedPosition = originalPosition + parallaxOffset + orbitalParallax;

      vec4 mvPosition = modelViewMatrix * vec4(adjustedPosition, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float sizeBoost = 1.0;

      if (atmosphereDensity > 0.0) {
        vec3 planetCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vec3 rayDir = normalize(mvPosition.xyz);

        float tClosest = dot(planetCenter, rayDir);
        vec3 closestPoint = tClosest * rayDir;
        float d = length(planetCenter - closestPoint);

        float outerFade = 1.0 - smoothstep(uPlanetRadius, atmosphereRadius, d);
        float innerFade = smoothstep(uPlanetRadius * 0.92, uPlanetRadius * 1.08, d);
        float atmoFactor = outerFade * innerFade;

        if (atmoFactor > 0.0) {
          float turbulenceStrength = atmoFactor * atmosphereDensity;
          float turb1 = sin(time * 3.7 + twinklePhase * 2.0) * 0.4;
          float turb2 = sin(time * 7.3 + twinklePhase * 4.0) * 0.25;
          float turb3 = sin(time * 13.1 + twinklePhase * 6.0) * 0.15;
          baseTwinkle *= 1.0 + turbulenceStrength * (turb1 + turb2 + turb3);

          vec4 planetClip = projectionMatrix * vec4(planetCenter, 1.0);
          vec2 planetNDC = planetClip.xy / planetClip.w;
          vec2 starNDC = gl_Position.xy / gl_Position.w;
          vec2 refrDir = normalize(starNDC - planetNDC);
          float refrBase = atmoFactor * atmosphereDensity * 0.04;
          float wobble = 0.6 + 0.4 * sin(time * 2.3 + twinklePhase * 3.0);
          gl_Position.xy += refrDir * (refrBase * wobble) * gl_Position.w;

          sizeBoost = 1.0 + atmoFactor * atmosphereDensity * 2.0;
          vAtmoBlur = atmoFactor * atmosphereDensity;

          vTangentDir = vec2(-refrDir.y, refrDir.x) * vAtmoBlur;
        }
      }

      vTwinkle = baseTwinkle;

      float sizeMultiplier = starType > 0.5 ? 1.2 : 1.0;
      gl_PointSize = size * sizeMultiplier * sizeBoost * (300.0 / -mvPosition.z);
    }
  `;static fragmentShader=`
    uniform vec3 starColor;

    varying float vBrightness;
    varying float vTwinkle;
    varying float vStarType;
    varying float vAtmoBlur;
    varying vec2 vTangentDir;

    void main() {
      vec2 centered = gl_PointCoord - vec2(0.5);

      float stretchMag = length(vTangentDir);
      if (stretchMag > 0.01) {
        vec2 tDir = vTangentDir / stretchMag;
        vec2 pDir = vec2(-tDir.y, tDir.x);
        float tComp = dot(centered, tDir);
        float pComp = dot(centered, pDir);
        float stretch = 1.0 + stretchMag * 0.6;
        centered = tDir * (tComp / stretch) + pDir * pComp;
      }

      float dist = length(centered);
      if (dist > 0.5) discard;

      float radialFalloff = 1.0 - dist * 2.0;
      radialFalloff = pow(max(radialFalloff, 0.0), max(1.0 - vAtmoBlur * 0.7, 0.3));

      float alpha = radialFalloff * vBrightness * vTwinkle;

      if (vStarType > 0.5) {
        alpha = pow(alpha, 1.0);
        alpha *= 1.5 + 1.5 * vTwinkle;
      } else {
        alpha = pow(alpha, 1.5);
        alpha *= 1.5;
      }

      vec3 finalColor;
      if (vStarType > 0.5) {
        vec3 variableTint = vec3(1.0, 0.6, 0.4);
        finalColor = starColor * variableTint * (0.8 + 0.4 * vTwinkle);
      } else {
        vec3 normalTint = vec3(1.0, 0.9, 0.7);
        finalColor = starColor * normalTint * (0.8 + 0.4 * vTwinkle);
      }

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;static attenuationVertexShader=`
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPos.xyz);
      gl_Position = projectionMatrix * mvPos;
    }
  `;static attenuationFragmentShader=`
    uniform float atmosphereDensity;

    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      float cosAngle = abs(dot(normalize(vNormal), normalize(vViewDir)));
      float edgeFactor = 1.0 - cosAngle;
      float pathEstimate = pow(edgeFactor, 0.6);

      float alpha = (1.0 - exp(-atmosphereDensity * pathEstimate * 3.0));

      gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
    }
  `;constructor(a,t={}){const n=t.seed!==void 0?t.seed:Math.floor(Math.random()*1e6),i=new g(n+1e4);this.params={color:t.color||new c(16777215),starCount:t.starCount!==void 0?t.starCount:Math.floor(i.uniform(e.STAR_COUNT.min,e.STAR_COUNT.max)),minBrightness:t.minBrightness!==void 0?t.minBrightness:i.uniform(e.MIN_BRIGHTNESS.min,e.MIN_BRIGHTNESS.max),maxBrightness:t.maxBrightness!==void 0?t.maxBrightness:i.uniform(e.MAX_BRIGHTNESS.min,e.MAX_BRIGHTNESS.max),minSize:t.minSize!==void 0?t.minSize:i.uniform(e.MIN_SIZE.min,e.MIN_SIZE.max),maxSize:t.maxSize!==void 0?t.maxSize:i.uniform(e.MAX_SIZE.min,e.MAX_SIZE.max),distance:t.distance!==void 0?t.distance:i.uniform(e.DISTANCE.min,e.DISTANCE.max),seed:n,twinkleSpeed:t.twinkleSpeed!==void 0?t.twinkleSpeed:i.uniform(e.TWINKLE_SPEED.min,e.TWINKLE_SPEED.max),parallaxStrength:t.parallaxStrength!==void 0?t.parallaxStrength:i.uniform(e.PARALLAX_STRENGTH.min,e.PARALLAX_STRENGTH.max),variableChance:t.variableChance!==void 0?t.variableChance:i.uniform(e.VARIABLE_CHANCE.min,e.VARIABLE_CHANCE.max),cosmicOriginTime:t.cosmicOriginTime,timeSpeed:t.timeSpeed!==void 0?t.timeSpeed:1,orbitalParallaxStrength:t.orbitalParallaxStrength!==void 0?t.orbitalParallaxStrength:i.uniform(e.ORBITAL_PARALLAX_STRENGTH.min,e.ORBITAL_PARALLAX_STRENGTH.max),atmosphereRadius:t.atmosphereRadius,planetRadius:t.planetRadius,atmosphereDensity:t.atmosphereDensity,atmosphereColor:t.atmosphereColor};const o=this.params.cosmicOriginTime||b;this.startTime=D(o),this.starCount=this.params.starCount,this.geometry=new _,this.material=this.createMaterial(),this.generateStars(a),this.starSystem=new I(this.geometry,this.material),this.starSystem.renderOrder=-100,(this.params.atmosphereDensity||0)>0&&this.params.atmosphereRadius&&this.createAttenuationSphere()}generateStars(a){const t=new Float32Array(this.starCount*3),n=new Float32Array(this.starCount*3),i=new Float32Array(this.starCount),o=new Float32Array(this.starCount),l=new Float32Array(this.starCount),s=new Float32Array(this.starCount),f=new Float32Array(this.starCount),M=this.params.seed,m=new g(M+1e4);for(let r=0;r<this.starCount;r++){const y=m.uniform(0,2*Math.PI),E=m.uniform(-1,1),p=Math.acos(E),R=this.params.distance,A=m.uniform(.7,1.3),S=R*A,T=S*Math.sin(p)*Math.cos(y),x=S*Math.sin(p)*Math.sin(y),C=S*Math.cos(p);t[r*3]=T,t[r*3+1]=x,t[r*3+2]=C,n[r*3]=T,n[r*3+1]=x,n[r*3+2]=C;const w=m.uniform(0,1)<this.params.variableChance;s[r]=w?1:0,f[r]=A,i[r]=m.uniform(this.params.minSize,this.params.maxSize),o[r]=m.uniform(this.params.minBrightness,this.params.maxBrightness),l[r]=m.uniform(0,Math.PI*2),w&&(o[r]=Math.min(1,o[r]+.2),l[r]=m.uniform(0,Math.PI*2))}this.geometry.setAttribute("position",new h(t,3)),this.geometry.setAttribute("originalPosition",new h(n,3)),this.geometry.setAttribute("size",new h(i,1)),this.geometry.setAttribute("brightness",new h(o,1)),this.geometry.setAttribute("twinklePhase",new h(l,1)),this.geometry.setAttribute("starType",new h(s,1)),this.geometry.setAttribute("distanceLayer",new h(f,1))}createMaterial(){const a=this.params.color instanceof c?this.params.color:new c(this.params.color);return new P({vertexShader:u.vertexShader,fragmentShader:u.fragmentShader,uniforms:{time:{value:0},starColor:{value:a},twinkleSpeed:{value:this.params.twinkleSpeed},cameraOffset:{value:new d(0,0,0)},parallaxStrength:{value:this.params.parallaxStrength},orbitalPosition:{value:new d(0,0,0)},orbitalParallaxStrength:{value:this.params.orbitalParallaxStrength},atmosphereRadius:{value:this.params.atmosphereRadius||0},uPlanetRadius:{value:this.params.planetRadius||0},atmosphereDensity:{value:this.params.atmosphereDensity||0}},transparent:!0,blending:B,depthWrite:!1,vertexColors:!1})}createAttenuationSphere(){this.attenuationGeometry=new L(this.params.atmosphereRadius,64,64),this.attenuationMaterial=new P({vertexShader:u.attenuationVertexShader,fragmentShader:u.attenuationFragmentShader,uniforms:{atmosphereDensity:{value:this.params.atmosphereDensity||0}},transparent:!0,blending:G,blendEquation:O,blendSrc:F,blendDst:z,depthWrite:!1,depthTest:!0,side:k}),this.attenuationMesh=new H(this.attenuationGeometry,this.attenuationMaterial),this.attenuationMesh.renderOrder=-99}addToScene(a,t){t&&this.starSystem.position.copy(t),a.add(this.starSystem),this.attenuationMesh&&(t&&this.attenuationMesh.position.copy(t),a.add(this.attenuationMesh))}update(a,t,n){const i=this.params.cosmicOriginTime||b,o=N(i,this.params.timeSpeed,this.startTime);if(this.material.uniforms.time.value=o,n){this.cameraPosition.copy(n.position);const l=new d().subVectors(this.cameraPosition,this.lastCameraPosition).multiplyScalar(.3);this.material.uniforms.cameraOffset.value.lerp(l,.1),this.lastCameraPosition.copy(this.cameraPosition)}}updateWithCamera(a,t){this.update(a,void 0,t)}updateParams(a){if(this.params={...this.params,...a},a.color!==void 0){const t=a.color instanceof c?a.color:new c(a.color);this.material.uniforms.starColor.value=t}a.twinkleSpeed!==void 0&&(this.material.uniforms.twinkleSpeed.value=a.twinkleSpeed),a.parallaxStrength!==void 0&&(this.material.uniforms.parallaxStrength.value=a.parallaxStrength),a.orbitalParallaxStrength!==void 0&&(this.material.uniforms.orbitalParallaxStrength.value=a.orbitalParallaxStrength)}updateOrbitalPosition(a){this.material.uniforms.orbitalPosition.value.copy(a)}getObject3D(){return this.starSystem}dispose(){this.geometry.dispose(),this.material.dispose(),this.attenuationGeometry&&this.attenuationGeometry.dispose(),this.attenuationMaterial&&this.attenuationMaterial.dispose()}}function U(v,a,t){const n=a!==void 0?a:Math.floor(Math.random()*1e6),i=new g(n+1e4),o={color:new c(16777215),starCount:Math.floor(i.uniform(e.STAR_COUNT.min,e.STAR_COUNT.max)),minBrightness:i.uniform(e.MIN_BRIGHTNESS.min,e.MIN_BRIGHTNESS.max),maxBrightness:i.uniform(e.MAX_BRIGHTNESS.min,e.MAX_BRIGHTNESS.max),minSize:i.uniform(e.MIN_SIZE.min,e.MIN_SIZE.max),maxSize:i.uniform(e.MAX_SIZE.min,e.MAX_SIZE.max),distance:i.uniform(e.DISTANCE.min,e.DISTANCE.max),seed:n,twinkleSpeed:i.uniform(e.TWINKLE_SPEED.min,e.TWINKLE_SPEED.max),parallaxStrength:i.uniform(e.PARALLAX_STRENGTH.min,e.PARALLAX_STRENGTH.max),variableChance:i.uniform(e.VARIABLE_CHANCE.min,e.VARIABLE_CHANCE.max)};if(t&&t.type&&t.type!=="None"){const l=t.width||12,s=t.color||[.7,.7,.7,.15],f=Array.isArray(s)&&s.length>=4?s[3]:.15;o.atmosphereRadius=v*(1+l/100),o.planetRadius=v,o.atmosphereDensity=f*(l/18),o.atmosphereColor=[Array.isArray(s)?s[0]:.7,Array.isArray(s)?s[1]:.7,Array.isArray(s)?s[2]:.7]}else o.atmosphereDensity=0;return new u(v,o)}export{u as S,U as c};
