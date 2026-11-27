import { Text, type TextStyle, type StyleProp } from 'react-native';
import { formatMoney, round2 } from '../format/format';
import { colors } from '../theme';

interface Props {
  value: number;
  /** Colour negatives as a loss and positives as a gain. */
  signed?: boolean;
  style?: StyleProp<TextStyle>;
}

export function MoneyText({ value, signed, style }: Props) {
  const r = round2(value);
  const color = signed ? (r < 0 ? colors.loss : r > 0 ? colors.gain : colors.text) : colors.text;
  return (
    <Text style={[{ color, fontVariant: ['tabular-nums'] }, style]}>{formatMoney(value)}</Text>
  );
}
