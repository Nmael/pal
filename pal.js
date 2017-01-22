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

function srgb_to_hex(color) {
	r = Math.round(color.r); g = Math.round(color.g); b = Math.round(color.b);

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
	tokens = colors_text.split(/[^a-zA-Z#\d]+/);
	colors = [];

	for(i = 0; i < tokens.length; ++i) {
		clean_token = tokens[i].replace(/[^0-9a-zA-Z#]/gi, '');
		this_color = hex_to_srgb(clean_token);
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
		square.css('background', srgb_to_hex(color))
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

function update_palettes() {
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
}

function parse_hash() {
	hash = window.location.hash.substr(1);

	matches = /^ex-(.*)/.exec(hash);
	if(matches) {
		load_example(matches[1]);
		return;
	}

	matches = /^p-(.*)/.exec(hash);
	if(matches) {
		load_hash_colors(matches[1]);
		return;
	}
}

function load_example(example_name) {
	color_text = null;
	switch(example_name) {
		case 'bootstrap':
			color_text = convert_colors(default_colors, srgb_to_hex);
			break;
		case 'stonesoup':
			color_text = convert_colors([
					{r: 57, g: 106, b: 177}, {r: 218, g: 124, b: 48}, {r: 62, g: 160, b: 81},
					{r: 204, g: 37, b: 41}, {r: 83, g: 81, b: 84}, {r: 107, g: 76, b: 154},
					{r: 146, g: 36, b:40}, {r: 148, g: 139, b: 61}
					], srgb_to_hex
			);
			break;
		case 'stonesoup-bars':
			color_text = convert_colors([
					{r: 114, g: 147, b: 203}, {r: 225, g: 151, b: 76}, {r: 132, g: 166, b: 91},
					{r: 211, g: 94, b: 96}, {r: 128, g: 133, b: 133}, {r: 144, g: 103, b: 167},
					{r: 171, g: 104, b: 87}, {r: 204, g: 194, b: 16}
					], srgb_to_hex
			);
			break;

		case 'tableau10':
			color_text = convert_colors([
					{r: 31, g: 119, b: 180}, {r: 255, g: 127, b: 14}, {r: 44, g: 160, b: 44},
					{r: 213, g: 39, b: 40}, {r: 148, g: 103, b: 189}, {r: 140, g: 86, b: 75},
					{r: 227, g: 119, b: 194}, {r: 127, g: 127, b: 127}, {r: 188, g: 189, b: 34},
					{r: 23, g: 190, b: 207},
				], srgb_to_hex
			);
			break;

		case 'tableau20':
			color_text = convert_colors([
					{r: 31, g: 119, b: 180}, {r: 174, g: 199, b: 232}, {r: 255, g: 127, b: 14},
					{r: 255, g: 187, b: 120}, {r: 44, g: 160, b: 44}, {r: 152, g: 223, b: 138},
					{r: 214, g: 39, b: 40}, {r: 255, g: 152, b: 150}, {r: 148, g: 103, b: 189},
					{r: 197, g: 176, b: 213}, {r: 140, g: 86, b: 75}, {r: 196, g: 156, b: 148},
					{r: 227, g: 119, b: 194}, {r: 247, g: 182, b: 210}, {r: 127, g: 127, b: 127},
					{r: 199, g: 199, b: 199}, {r: 188, g: 189, b: 34}, {r: 219, g: 219, b: 141},
					{r: 23, g: 190, b: 207}, {r: 158, g: 218, b: 229}
				], srgb_to_hex
			);
			break;
	}

	if(color_text) {
		$('#palette-input').val(color_text.join(' '));
		update_palettes();
	}
}

function make_palette_link() {
	srgb_colors = parse_colors($('#palette-input').val());
	color_str = 'p-'
	for(i = 0; i < srgb_colors.length; ++i) {
		color_str += srgb_to_hex(srgb_colors[i]).substr(1); // substr removes # character
		if(i < srgb_colors.length - 1) {
			color_str += '-';
		}
	}

	window.location.hash = color_str;
	$('#palette-link').attr('href', window.location.href);
	$('#palette-link').text(window.location.href);
}

function load_hash_colors(hash_colors) {
	colors = hash_colors.split('-');
	$('#palette-input').val(colors.join(' '));
	update_palettes();
}

$('#palette-input').bind('input propertychange', function() { update_palettes() });

// default values
default_colors = [{r: 255, g: 111, b: 0}, {r: 205, g: 118, b: 15}, {r: 155, g: 126, b: 30}, {r: 105, g: 134, b: 45}, {r: 56, g: 142, b: 60},
					{r: 43, g: 139, b: 144}, {r: 36, g: 137, b: 186}];
update_palette($('#palette-original'), default_colors);
update_palette($('#palette-grayscale'), convert_colors(default_colors, to_grayscale));
update_palette($('#palette-deuteranomaly'), convert_colors(default_colors, fBlind['Deuteranomaly']));
update_palette($('#palette-deuteranopia'), convert_colors(default_colors, fBlind['Deuteranopia']));
update_palette($('#palette-protanomaly'), convert_colors(default_colors, fBlind['Protanomaly']));
update_palette($('#palette-protanopia'), convert_colors(default_colors, fBlind['Protanopia']));

// monitor bg toggle button
$('#bg-toggle').click(function() {
	$('body').toggleClass('body-bg-dark');
	$('.github-logo').toggleClass('github-logo-dark');
});

// monitor palette link button
$('#palette-link-btn').click(function() { make_palette_link(); });

// monitor hash for changes (e.g., back button)
$(window).on('hashchange', function() { parse_hash(); });

// monitor example links
$('.ex-link').click(function() {
	location.href = $(this).attr('href');
	parse_hash();
});

// interpret hash if user originally navigated to a URL including one
parse_hash();
