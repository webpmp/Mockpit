import React from 'react';
import { ManeuverType } from '../../types';

interface ManeuverGlyphProps {
  type: ManeuverType;
  color?: string;
  className?: string;
}

/**
 * High-contrast, bold automotive maneuver vector arrows.
 * Glanceable primary navigation cues following standard automotive HMI conventions.
 * Strictly non-pulsing and static.
 */
export const ManeuverGlyph: React.FC<ManeuverGlyphProps> = ({
  type,
  color = 'currentColor',
  className = '',
}) => {
  switch (type) {
    case 'straight':
      return (
        <g className={className} id="maneuver-glyph-straight">
          {/* Vertical shaft and bold arrowhead pointing straight ahead */}
          <path
            d="M 160 135 L 215 190 L 180 190 L 180 300 L 140 300 L 140 190 L 105 190 Z"
            fill={color}
          />
        </g>
      );

    case 'slight-left':
      return (
        <g className={className} id="maneuver-glyph-slight-left">
          <path
            d="M 210 380 L 270 380 Q 270 241 177 148 L 191 134 L 120 120 L 134 191 L 148 177 Q 210 240 210 380 Z"
            fill={color}
          />
        </g>
      );

    case 'slight-right':
      return (
        <g className={className} id="maneuver-glyph-slight-right">
          <path
            d="M 190 380 L 130 380 Q 130 241 223 148 L 209 134 L 280 120 L 266 191 L 252 177 Q 190 240 190 380 Z"
            fill={color}
          />
        </g>
      );

    case 'left':
      return (
        <g className={className} id="maneuver-glyph-left">
          {/* 90-degree left turn maneuver arrow */}
          <path
            d="M 30 185 L 125 125 L 125 168 Q 195 170 195 210 L 195 330 L 165 330 L 165 218 Q 165 198 125 198 L 125 245 Z"
            fill={color}
          />
        </g>
      );

    case 'right':
      return (
        <g className={className} id="maneuver-glyph-right">
          {/* 90-degree right turn maneuver arrow */}
          <path
            d="M 195 330 L 165 330 L 165 218 Q 165 198 205 198 L 205 245 L 300 185 L 205 125 L 205 168 Q 135 170 135 210 L 135 330 Z"
            fill={color}
          />
        </g>
      );

    // Follow-up extensions (fallback safe glyphs)
    case 'merge-left':
      return (
        <g className={className} id="maneuver-glyph-merge-left">
          <path
            d="M 230 380 L 170 380 L 170 285 L 105 330 L 80 295 L 157 242 Q 170 230 170 200 L 170 180 L 130 180 L 200 90 L 270 180 L 230 180 L 230 380 Z"
            fill={color}
          />
        </g>
      );

    case 'merge-right':
      return (
        <g className={className} id="maneuver-glyph-merge-right">
          <path
            d="M 170 380 L 230 380 L 230 285 L 295 330 L 320 295 L 243 242 Q 230 230 230 200 L 230 180 L 270 180 L 200 90 L 130 180 L 170 180 L 170 380 Z"
            fill={color}
          />
        </g>
      );

    case 'lane-ends-right':
      return (
        <g className={className} id="maneuver-glyph-lane-ends-right">
          <rect x="40" y="30" width="40" height="340" fill={color} />
          <rect x="162.5" y="195" width="15" height="35" fill={color} />
          <rect x="162.5" y="255" width="15" height="35" fill={color} />
          <rect x="162.5" y="315" width="15" height="35" fill={color} />
          <path d="M 195 30 L 235 30 L 235 120 L 285 185 L 285 370 L 245 370 L 245 195 L 195 130 Z" fill={color} />
        </g>
      );

    case 'lane-ends-left':
      return (
        <g className={className} id="maneuver-glyph-lane-ends-left">
          <rect x="220" y="30" width="40" height="340" fill={color} />
          <rect x="122.5" y="195" width="15" height="35" fill={color} />
          <rect x="122.5" y="255" width="15" height="35" fill={color} />
          <rect x="122.5" y="315" width="15" height="35" fill={color} />
          <path d="M 105 30 L 65 30 L 65 120 L 15 185 L 15 370 L 55 370 L 55 195 L 105 130 Z" fill={color} />
        </g>
      );
    case 'sharp-left':
      return (
        <g className={className} id="maneuver-glyph-sharp-left">
          <path
            d="M 85 220 L 145 155 L 145 190 Q 185 192 185 240 L 185 300 L 155 300 L 155 248 Q 155 220 135 220 L 145 255 Z"
            fill={color}
          />
        </g>
      );

    case 'sharp-right':
      return (
        <g className={className} id="maneuver-glyph-sharp-right">
          <path
            d="M 235 220 L 175 255 L 185 220 Q 165 220 165 248 L 165 300 L 135 300 L 135 240 Q 135 192 175 190 L 175 155 Z"
            fill={color}
          />
        </g>
      );

    case 'u-turn-left':
    case 'u-turn-right':
      return (
        <g className={className} id="maneuver-glyph-u-turn">
          <path
            d="M 120 250 L 85 195 L 115 195 L 115 165 Q 115 135 160 135 Q 205 135 205 165 L 205 300 L 175 300 L 175 165 Q 175 155 160 155 Q 145 155 145 165 L 145 195 L 155 195 Z"
            fill={color}
          />
        </g>
      );

    case 'arrive':
      return (
        <g className={className} id="maneuver-glyph-arrive">
          {/* Destination Pin / Flag glyph */}
          <path
            d="M 160 140 C 140 140 125 155 125 175 C 125 205 160 255 160 255 C 160 255 195 205 195 175 C 195 155 180 140 160 140 Z M 160 190 C 151.7 190 145 183.3 145 175 C 145 166.7 151.7 160 160 160 C 168.3 160 175 166.7 175 175 C 175 183.3 168.3 190 160 190 Z"
            fill={color}
          />
          <ellipse cx="160" cy="275" rx="35" ry="8" fill={color} opacity="0.4" />
        </g>
      );

    default:
      return (
        <g className={className} id="maneuver-glyph-default">
          <path
            d="M 160 135 L 215 190 L 180 190 L 180 300 L 140 300 L 140 190 L 105 190 Z"
            fill={color}
          />
        </g>
      );
  }
};
