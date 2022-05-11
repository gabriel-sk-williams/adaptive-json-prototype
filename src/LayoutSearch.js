import React, { Component } from 'react';
import DropMenu from './component/DropMenu.js';
import FieldString from './component/FieldString.js';

class LayoutSearch extends Component {

	constructor(props){
		super(props)
		this.state = {
			address: props.address || '',
			keyword: props.keyword || '',
			search: [{
						id: 0,
						title: 'Keyword',
						selected: false,
						key: 'search'
					},
					{
						id: 1,
						title: 'Address',
						selected: false,
						key: 'search'
					},
					{
						id: 2,
						title: 'Key',
						selected: true,
						key: 'search'
					},
					{
						id: 3,
						title: 'Name',
						selected: false,
						key: 'search'
					}]
		}
	}

	onFieldChange = (title, value) => {
		let id = title.toLowerCase();
		this.setState({
			[id]: value
		}, () => {
			this.props.returnObj(this.getAllSelected());
		});
	}

	toggleSelected = (id, key) => {
		let menuObj = this.state[key];
		for (let i in menuObj) {
			menuObj[i].selected = false;
		}
		
		menuObj[id].selected = true;
		
		this.setState({
		  	[key]: menuObj
		}, () => {
			this.props.returnObj(this.getAllSelected());
		});
	}

	getSelectedItem = (obj) => { return obj.filter(item => item.selected)[0].title; }

	getAllSelected = () => {
		const keyArray = Object.keys(this.state);
		const stateObj = this.state;

		const selected = keyArray.reduce(function(acc, item) {
			const val = stateObj[item];
			if (typeof(val) === 'number' || typeof(val) === 'string') {
				acc[item] = val;
			}

			for (let i = 0; i < val.length; i++) {
				if (val[i].selected === true) {
					acc[item] = val[i].title.toLowerCase();
				}
			}
			return acc;
		}, {});

		return selected;
	}

	render() {
		const { keyword, address } = this.props;
		let searchTitle = this.getSelectedItem(this.state.search);
		let searchVal = searchTitle === 'keyword' ? keyword : address;
		return (
				<div id={this.props.id} className="">
					<DropMenu 
						id="minor" 
						title={searchTitle} 
						list={this.state.search} 
						toggleItem={this.toggleSelected}
					/>
					<FieldString
						id={searchTitle}
						value={searchVal}
						placeholder="Search Query"
						onChange={this.onFieldChange}
					/>
				</div>
		);
	}
}

export default LayoutSearch