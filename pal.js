function hex_to_srgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	// http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function srgb_to_hex(r, g, b) {
	r = Math.round(r); g = Math.round(g); b = Math.round(b);

	function srgb_component_to_hex(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}

    return "#" + srgb_component_to_hex(r) + srgb_component_to_hex(g) + srgb_component_to_hex(b);
}

function gamma_expand(color) {
	// Values from https://en.wikipedia.org/wiki/Grayscale#Colorimetric_.28luminance-preserving.29_conversion_to_grayscale
	cr = color.r / 255
	cg = color.g / 255
	cb = color.b / 255

	function expand(c) { return (c <= 0.04045) ? c / 12.92 : Math.pow((c + 0.055)/1.055, 2.4) }
	return {r: expand(cr), g: expand(cg), b: expand(cb)}
}

function gamma_compress(color) {
	function compress(c) {
		return 255*((c <= 0.0031308)? 12.92*c : 1.055*Math.pow(c, gamma_compress.inv_gamma) - 0.055);
	}

	return {r: compress(color.r), g: compress(color.g), b: compress(color.b)}
}
gamma_compress.inv_gamma = 1.0/2.4

function parse_colors(colors_text) {
	tokens = colors_text.split(/\s+/);
	colors = [];

	for(i = 0; i < tokens.length; ++i) {
		this_color = hex_to_srgb(tokens[i]);
		if(this_color) colors.push(this_color);
	}

	return colors;
}

function update_palette(div, colors) {
	div.empty();

	for(i = 0; i < colors.length; ++i) {
		color = colors[i];
		square = $(document.createElement('div'));
		square.addClass('square');
		square.css('background', srgb_to_hex(color.r, color.g, color.b))
		div.append(square);
	}
}

function convert_colors(colors, fn) {
	new_colors = colors.slice();

	for(i = 0; i < new_colors.length; ++i) {
		new_colors[i] = fn(new_colors[i]);
	}

	return new_colors;
}

function to_grayscale(lrgb_color) {
	avg = 0.2126 * lrgb_color.r + 0.7152 * lrgb_color.g + 0.0722 * lrgb_color.b;

	return {r: avg, g: avg, b: avg}
}

$('#palette-input').bind('input propertychange', function() {
	srgb_colors = parse_colors($('#palette-input').val());
	lrgb_colors = convert_colors(srgb_colors, gamma_expand);

	if(colors.length > 0) {
		colors_grayscale = convert_colors(convert_colors(lrgb_colors, to_grayscale), gamma_compress);
		colors_deuteranomaly = convert_colors(srgb_colors, fBlind['Deuteranomaly'])
		colors_deuteranopia = convert_colors(srgb_colors, fBlind['Deuteranopia'])
		colors_protanomaly = convert_colors(srgb_colors, fBlind['Protanomaly'])
		colors_protanopia = convert_colors(srgb_colors, fBlind['Protanopia'])

		update_palette($('#palette-original'), srgb_colors);
		update_palette($('#palette-grayscale'), colors_grayscale);
		update_palette($('#palette-deuteranomaly'), colors_deuteranomaly);
		update_palette($('#palette-deuteranopia'), colors_deuteranopia);
		update_palette($('#palette-protanomaly'), colors_protanomaly);
		update_palette($('#palette-protanopia'), colors_protanopia);
	}
})

// default values
default_colors = [{r: 255, g: 111, b: 0}, {r: 205, g: 118, b: 15}, {r: 155, g: 126, b: 30}, {r: 105, g: 134, b: 45}, {r: 56, g: 142, b: 60},
					{r: 49, g: 140, b: 102}, {r: 43, g: 139, b: 144}, {r: 36, g: 137, b: 186}];
update_palette($('#palette-original'), default_colors);
update_palette($('#palette-grayscale'), convert_colors(default_colors, to_grayscale));
update_palette($('#palette-deuteranomaly'), convert_colors(default_colors, fBlind['Deuteranomaly']));
update_palette($('#palette-deuteranopia'), convert_colors(default_colors, fBlind['Deuteranopia']));
update_palette($('#palette-protanomaly'), convert_colors(default_colors, fBlind['Protanomaly']));
update_palette($('#palette-protanopia'), convert_colors(default_colors, fBlind['Protanopia']));
