//import React, { Component, Text, View } from 'react';
import React, { Component } from 'react';
import PanelHeader from './PanelHeader.js';
import PanelContent from './PanelContent.js';
import SelectedContent from './SelectedContent.js';
import TabContainer from './TabContainer.js';
import TabScale from './TabScale.js';
import Tab from './Tab.js';
import './Intstyles.css';

class Panel extends Component {
	constructor(props) {
		super(props);
		this.state = {
			activeTab: "Model",
			activeScale: "Region",
			selected: props.selected,
			hovered: props.hovered
		}
	}

	returnObj = (menuObj) => { this.props.returnMenuObj(menuObj); }
	returnDensity = (density) => { this.props.returnDensity(density); }
	toggleModel = () => { this.props.toggleModel(); }
	hlLayer = () => { this.props.hlLayer(); }
	
	// if panel gets new Layer, update State
	// if panel gets new Scale from Tab, update State
	getScale = (layer) => { // consider getting from mesh directly
		let scale =
			layer === "osm_point" ||
			layer === "transit_point" ||
			layer === "building" ||
			layer === "parking" 
			? "Lot" 
			: layer === "block" ||
			  layer === "hex" ||
			  layer === "transit_path" ||
			  layer === "natural_path" ||
			  layer === "locale" ||
			  layer === "graph" ||
			  layer === "capacity" ||
			  layer === "parcel" ||
			  layer === "zoning" ||
			  layer === "street"
			? "Block" 
			: "Region";
		return scale;
	}

	static getDerivedStateFromProps(props, state) {
		if (props.selected !== state.selected) { return { selected: props.selected }; }
		if (props.hovered !== state.hovered) { return { hovered: props.hovered }; }
		return null;
	}

	componentDidUpdate(prevProps) {
		if (prevProps.selected !== this.state.selected) {
			if (this.props.selected) {
				let scale = this.getScale(this.props.selected.layer) || null;
				this.setState({ activeScale: scale });
			}
		}

		if (prevProps.hovered !== this.state.hovered) {
			if (this.props.hovered) {
				let scale = this.getScale(this.props.hovered.layer) || null;
				this.setState({ activeScale: scale });
			}
		}
	}

	changeActiveTab = (tabId) => {
		this.setState({
			activeTab: tabId
		}, () => {
			this.props.returnTab(tabId);
		});
	}

	// needs to overwrite activeScale
	changeActiveScale = (scaleId) => {
		this.setState({
			activeScale: scaleId
		}, () => {
			this.props.returnScale(scaleId);
		});
	}

	render() {
		return (
		  <div className="Panel" >
				<div className="panel-container">
					<PanelHeader>
					v. alpha 2021
					</PanelHeader>
				
					<TabContainer className="tab-container">			
						<Tab 
							id="Model" 
							changeActiveTab={this.changeActiveTab} 
							activeTab={this.state.activeTab} 
						/>
						<Tab 
							id="Layers" 
							changeActiveTab={this.changeActiveTab} 
							activeTab={this.state.activeTab} 
						/>
						<Tab 
							id="Search" 
							changeActiveTab={this.changeActiveTab} 
							activeTab={this.state.activeTab}
						/>
					</TabContainer>
				</div>

				<PanelContent 	
					activeTab={this.state.activeTab}
					returnDensity={this.returnDensity}
					returnObj={this.returnObj}
					toggleModel={this.toggleModel}
					hlLayer={this.hlLayer}

					layer={this.props.layer} 
					density={this.props.density}
				/>

				<TabContainer className="tab-container dark">			
					<TabScale
						id="Region" 
						changeActiveScale={this.changeActiveScale} 
						activeScale={this.state.activeScale} 
					/>
					<TabScale
						id="Block" 
						changeActiveScale={this.changeActiveScale} 
						activeScale={this.state.activeScale} 
					/>
					<TabScale
						id="Lot" 
						changeActiveScale={this.changeActiveScale}
						activeScale={this.state.activeScale} 
					/>
				</TabContainer>

				<div className="panel-container">
					<SelectedContent 
						meta={this.props.meta}
						hovered={this.props.hovered}
						selected={this.props.selected}
						activeScale={this.state.activeScale}
					/>
				</div>
		  </div>
		);
	}
}

export default Panel;
