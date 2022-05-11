import React, { Component } from "react";

class SelectedContent extends Component {

	rp = (string) => {
		return string.replace(/^\w/, c => c.toUpperCase());
	}

	header = (layer) => {
		if (layer.includes("_")) {
			if (layer === "osm_point") return "OSM Point Datum";
			if (layer === "transit_point") return "Transit Point Datum";
			let substring = layer.substring(0, layer.indexOf("_"));
			return substring.replace(/^\w/, c => c.toUpperCase());
		}
		return layer.replace(/^\w/, c => c.toUpperCase());
	}

	lotContent = (display) => {

		const pointContent = (display) => {
			let { layer, subtype, properties } = display;
			const header = display ? this.header(layer) : null;
			const type = "Subtype: " + subtype.replace(/^\w/, c => c.toUpperCase());
			const name = properties.name || null;
			const address = properties["addr:postcode"] && properties["addr:street"]
				? properties["addr:postcode"] + " " + properties["addr:street"]
				: null;
			const data = subtype === "amenity" ? properties.amenity : null;

			return (
				<div>
					<h2>{header}</h2>
					<h2 className="feather">{type}</h2>
					<h2 className="feather">{name}</h2>
					<h2 className="feather">{address}</h2>
					<h2 className="feather">{data}</h2>
				</div>
			);
		}

		const meshContent = (display) => {
			const header = this.header(display.layer) || null;
			const name = display.name !== "unknown" ? display.name : null;
			const location = display.address && Array.isArray(display.address)
				? display.address[0] // .join(", ") -> full address
				: display.address;
			const address = location && location !== "unknown" 
				? "Address: " + location
				: null;
	
			const lotArea = "Footprint: " + display["area:sf"] + " sf";
			const height = display.height 
				? "Height: " + Math.round(display.height) + " ft." 
				: null;
			const coverage = display.layer === "building" 
				? "Coverage: " + display.coverage + "%" 
				: null;
			const pop = display["pop:total"] 
				? "Population: " + display["pop:total"] 
				: null;
	
			return (
				<div>
					<h2>{header}</h2>
					<h2 className="feather">{name}</h2>
					<h2 className="feather">{address}</h2>
					<h2 className="feather">{lotArea}</h2>
					<h2 className="feather">{height}</h2>
					<h2 className="feather">{coverage}</h2>
					<h2 className="feather">{pop}</h2>
				</div>
			);
		}

		if (display) {
			return (
				display.layer === "osm_point" || display.layer === "transit_point"
				? pointContent(display)
				: meshContent(display)
			);
		}
	}

	blockContent = (display) => {
		if (display) {
			const header = this.header(display.layer) || null;
			const name = display.name === "unknown" ? display.subtype + " street" : display.name;
			// const key = display.key || null;
			const area = display["area_sf"] 
				? "Area: " + display["area_hectare"] + " hectares" 
				: null;
			const parcel = display["mun_landID"] 
				? "Municipal ID: " + display["mun_landID"]
				: null;
			const zoning = display.designation 
				? "Zoning: " + display.designation
				: display.subtype 
				? "Subtype: " + display.subtype
				: null;
			const density = display["density_total"] 
				? "Density: " + display["density_total"] + " persons / hectare"
				: null;

			return (
				<div>
					<h2>{header}</h2>
					<h2 className="feather">{name}</h2>
					<h2 className="feather">{zoning}</h2>
					<h2 className="feather">{parcel}</h2>
					<h2 className="feather">{area}</h2>
					<h2 className="feather">{density}</h2>
				</div>
			);
		}else{
			return null;
		}
	}

	regionContent = (meta) => {
		const { "area_hectare":area, "pop_total":pop } = meta;
		const density = (pop/area).toFixed(0);
		const region = meta.city.replace(/^\w/, c => c.toUpperCase()) + ", Texas";
		const population = "Population: " + pop.toString().replace(/(\d)(?=(\d{3})+$)/g, "$1,");
		const regionArea = "Area: " + area + " hectares";
		const regionDensity = "Density: " + density + " persons / hectare";

		return (
			<div>
				<h2>{region}</h2>
				<h2 className="feather">{population}</h2>
				<h2 className="feather">{regionArea}</h2>
				<h2 className="feather">{regionDensity}</h2>
			</div>
		);
	}

	render() {
		const meta = this.props.meta;
		const hovered = this.props.hovered;
		const selected = this.props.selected;
		const display = hovered || selected;
		const content = this.props.activeScale;

		const textDisplay = content === "Lot"
			? this.lotContent(display)
			: content === "Block"
			? this.blockContent(display)
			: content === "Region"
			? this.regionContent(meta)
			: null;

		return (
			<div className="selected-content">	
				{textDisplay}
			</div>
		);
	}
}

export default SelectedContent;