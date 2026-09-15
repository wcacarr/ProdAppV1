import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Line, Polyline, Rect, G } from 'react-native-svg';
import { colors } from '../theme';

// Hand-drawn nature/zen-garden wallpaper, ported from the SVG in
// project/Questlock v2.dc.html (sun disc, mountain ridgelines, pines,
// raked-sand ripple arcs, rocks, horizon line).
export default function NatureBackground() {
  return (
    <Svg
      viewBox="0 0 412 820"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
    >
      <Rect x={0} y={0} width={412} height={820} fill={colors.paperLight} />

      <Circle cx={292} cy={196} r={74} fill={colors.ochre} />
      <Circle cx={292} cy={196} r={74} fill="none" stroke={colors.ink} strokeOpacity={0.2} strokeWidth={1} />

      <G fill="none" stroke={colors.ink} strokeOpacity={0.3} strokeWidth={0.9}>
        <Polyline points="0,300 62,214 104,252 168,150 214,206 262,168 320,240 372,196 412,238" />
        <Polyline points="0,352 54,300 96,330 150,268 206,318 250,286 306,340 360,300 412,338" />
      </G>

      <G fill="none" stroke={colors.ink} strokeOpacity={0.22} strokeWidth={0.8}>
        <Line x1={168} y1={150} x2={140} y2={252} />
        <Line x1={168} y1={150} x2={196} y2={246} />
        <Line x1={168} y1={150} x2={178} y2={256} />
        <Line x1={62} y1={214} x2={40} y2={290} />
        <Line x1={62} y1={214} x2={82} y2={284} />
        <Line x1={262} y1={168} x2={246} y2={248} />
        <Line x1={262} y1={168} x2={280} y2={242} />
        <Line x1={372} y1={196} x2={356} y2={258} />
        <Line x1={372} y1={196} x2={390} y2={254} />
      </G>

      <G fill="none" stroke={colors.ink} strokeOpacity={0.42} strokeWidth={1}>
        <Polyline points="42,430 58,372 74,430" />
        <Line x1={58} y1={430} x2={58} y2={444} />
        <Polyline points="74,438 92,392 110,438" />
        <Line x1={92} y1={438} x2={92} y2={450} />
        <Polyline points="336,436 352,386 368,436" />
        <Line x1={352} y1={436} x2={352} y2={450} />
      </G>

      <G fill="none" stroke={colors.ink} strokeOpacity={0.26} strokeWidth={0.9}>
        <Ellipse cx={206} cy={624} rx={42} ry={10} />
        <Ellipse cx={206} cy={624} rx={86} ry={21} />
        <Ellipse cx={206} cy={624} rx={134} ry={32} />
        <Ellipse cx={206} cy={624} rx={186} ry={43} />
        <Ellipse cx={206} cy={624} rx={242} ry={54} />
        <Ellipse cx={206} cy={624} rx={300} ry={65} />
        <Ellipse cx={206} cy={624} rx={362} ry={76} />
      </G>

      <G fill="none" stroke={colors.ink} strokeOpacity={0.45} strokeWidth={1}>
        <Circle cx={196} cy={626} r={14} />
        <Circle cx={222} cy={634} r={8} />
        <Circle cx={178} cy={638} r={5} />
      </G>

      <Line x1={0} y1={474} x2={412} y2={474} stroke={colors.ink} strokeOpacity={0.14} strokeWidth={1} />
    </Svg>
  );
}
