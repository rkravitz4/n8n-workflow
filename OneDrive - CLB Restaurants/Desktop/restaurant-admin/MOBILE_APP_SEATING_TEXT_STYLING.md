# Mobile App Seating Text Styling Update

## New Feature Added
The webapp now supports color and bold styling for the "Open Seating" / "Limited Seating" text in events.

## Database Changes
Two new fields have been added to the events table:
- `seating_text_color` (TEXT): Color of the seating type text
- `seating_text_bold` (BOOLEAN): Whether the seating type text is bold

## Default Values
- `seating_text_color`: `#810000` (maroon)
- `seating_text_bold`: `false`

## API Response
The `/api/events` endpoint now returns these additional fields:
```json
{
  "seating_text_color": "#810000",
  "seating_text_bold": false
}
```

## Implementation Examples

### React Native
```javascript
// Seating Type Display
<View style={{
  backgroundColor: event.seating_type === 'open' ? '#dcfce7' : '#fef3c7',
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 12,
  alignSelf: 'flex-start'
}}>
  <Text style={{
    fontSize: 12,
    fontWeight: event.seating_text_bold ? 'bold' : '500',
    color: event.seating_text_color || (event.seating_type === 'open' ? '#166534' : '#92400e')
  }}>
    {event.seating_type === 'open' ? 'Open Seating' : 'Limited Seating'}
  </Text>
</View>
```

### Flutter
```dart
// Seating Type Display
Container(
  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
  decoration: BoxDecoration(
    color: event.seatingType == 'open' ? Color(0xFFDCFCE7) : Color(0xFFFEF3C7),
    borderRadius: BorderRadius.circular(12),
  ),
  child: Text(
    event.seatingType == 'open' ? 'Open Seating' : 'Limited Seating',
    style: TextStyle(
      fontSize: 12,
      fontWeight: event.seatingTextBold ? FontWeight.bold : FontWeight.w500,
      color: Color(int.parse(event.seatingTextColor.replaceFirst('#', '0xff'))) ?? 
             (event.seatingType == 'open' ? Color(0xFF166534) : Color(0xFF92400E)),
    ),
  ),
)
```

### Swift (iOS)
```swift
// Seating Type Display
let seatingLabel = UILabel()
seatingLabel.text = event.seatingType == "open" ? "Open Seating" : "Limited Seating"
seatingLabel.font = event.seatingTextBold ? UIFont.boldSystemFont(ofSize: 12) : UIFont.systemFont(ofSize: 12, weight: .medium)
seatingLabel.textColor = UIColor(hex: event.seatingTextColor) ?? 
                        (event.seatingType == "open" ? UIColor(hex: "#166534") : UIColor(hex: "#92400e"))

let seatingContainer = UIView()
seatingContainer.backgroundColor = event.seatingType == "open" ? UIColor(hex: "#dcfce7") : UIColor(hex: "#fef3c7")
seatingContainer.layer.cornerRadius = 12
seatingContainer.addSubview(seatingLabel)
```

### Kotlin (Android)
```kotlin
// Seating Type Display
val seatingTextView = TextView(context)
seatingTextView.text = if (event.seatingType == "open") "Open Seating" else "Limited Seating"
seatingTextView.typeface = if (event.seatingTextBold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
seatingTextView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
seatingTextView.setTextColor(Color.parseColor(event.seatingTextColor ?: 
    if (event.seatingType == "open") "#166534" else "#92400e"))

val seatingContainer = LinearLayout(context)
seatingContainer.setBackgroundColor(Color.parseColor(
    if (event.seatingType == "open") "#dcfce7" else "#fef3c7"
))
seatingContainer.radius = 12f
seatingContainer.addView(seatingTextView)
```

## Background Colors
The seating type badges should maintain their background colors for visual consistency:
- **Open Seating**: Light green background (`#dcfce7`)
- **Limited Seating**: Light yellow background (`#fef3c7`)

Only the text color and bold styling should be customizable by the user.

## Testing Checklist
- [ ] Test with events where `seating_text_bold: true`
- [ ] Test with events where `seating_text_bold: false`
- [ ] Test with custom `seating_text_color` values
- [ ] Test with default values (should use maroon color)
- [ ] Test with both "Open Seating" and "Limited Seating" types
- [ ] Verify background colors remain consistent
- [ ] Test with null/undefined values (should use defaults)

## Expected Result
The seating type text should now respect the color and bold styling settings from the webapp, while maintaining the appropriate background colors for visual distinction between "Open" and "Limited" seating.
