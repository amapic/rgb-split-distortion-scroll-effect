// uniform sampler2D uTexture;
// uniform float uAlpha;
// uniform vec2 uOffset;
// varying vec2 vUv;

// void main(){
//     gl_FragColor = vec4(255.,255.,255.,255.);
// }


 uniform sampler2D uTexture;
 uniform float uAlpha;
 uniform vec2 uOffset;
 varying vec2 vUv;

vec3 rgbShift(sampler2D textureImage, vec2 uv, vec2 offset) {
   float r = texture2D(textureImage,uv + offset).r;
  //  float g = texture2D(textureImage,uv + offset).g;
  //  float b = texture2D(textureImage,uv + offset).b;
   vec2 gb = texture2D(textureImage,uv).gb;
   return vec3(r,gb);
  //  return vec3(r,g,b);
 }

void main() {
   vec3 color = rgbShift(uTexture,vUv,uOffset);
   gl_FragColor = vec4(color,uAlpha);
 }