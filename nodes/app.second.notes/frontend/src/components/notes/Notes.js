import React, { Component } from 'react';
import PropTypes from 'prop-types';

import GlobalState from 'second-fe-react-hoc-globalstate';

import './styles.css'

class Apps extends Component {
  static propTypes = {
    title: PropTypes.string,
    searchComponent: PropTypes.func
  };

  constructor(props){
    super(props);
    
    this.state = {
      notes: [],
      filteredNotes: [],
      searchStr: ''
    }
    
  }
  
  componentDidMount(){
    this.fetchNotes();
  }

  fetchNotes = async () => {
    
    // let response = await fetch('/api/get_for_pattern',{
    //   method: 'POST',
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     pattern: 'app.*.*',
    //     excludeData: true
    //   })
    // });

    const rawResponse = await fetch('/ai', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'types.second.default.request.input',
        data: {
          auth: {
            token: window.localStorage.getItem('token')
          },
          serviceName: 'services.second.default.get_for_pattern',
          actionPath: 'builtin-input',
          inputNode: {
            type: '...',
            data: {
              pattern: 'data.second.notes.note_list.*',
              opts: {
                excludeData: false
              }
            }
          },
          extras: {}
        }
      })
    });
    const nodeResponse = await rawResponse.json(); // should be returned in data?

    // response.data, nodelist.data = array 
    let notes = nodeResponse.data.data;

    console.log('Notes:', notes);
    // return false;
    
    this.setState({
      notes, 
      loading:false
    }, this.updateFilter)
    
  }

  createNote = async () => {
    // create note here 

    let name = Date.now();
    let title = window.prompt('Title:','');
    if(!title){
      return false;
    }

    let noteNode = {
      type: 'types.second.default.note',
      data: {
        title,
        text: ''
      }
    }

    const rawResponse = await fetch('/ai', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'types.second.default.request.input',
        data: {
          auth: {
            token: window.localStorage.getItem('token')
          },
          serviceName: 'services.second.default.put_to_list', // name will get created! 
          actionPath: 'data.second.notes.note_list',
          inputNode: noteNode,
          extras: {}
        }
      })
    });
    const nodeResponse = await rawResponse.json(); // should be returned in data?

    await this.fetchNotes();

  }

  handleSearch = async (searchStr) => {
    // filter nodes 
    this.setState({
      searchStr
    }, this.updateFilter);

  }

  updateFilter = () => {
    let searchStr = this.state.searchStr.toLowerCase();

    let notes = this.state.notes.filter(note=>{
      let title = note.data.title || '';
      let text = note.data.text || '';
      if(title.toLowerCase().indexOf(searchStr) > -1 || 
        text.toLowerCase().indexOf(searchStr) > -1){
        return true;
      }
    });

    this.setState({
      filteredNotes: notes
    });
  }

  render(){
    console.log('Apps props:', this.props, this.state);

    let filteredNotes = this.state.filteredNotes;
    
    return (
      <section className="hero is-fullheight is-white has-background-primary">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-6">

                <div className="box" style={{background:'white'}}>

                  <h1 className="title" onClick={this.fetchApps} style={{borderBottom:'2px solid #ddd', paddingBottom:'24px'}}>
                    {this.props.title || 'No Note Title'}

                    <button className="button is-success is-pulled-right" onClick={this.createNote}>
                      <span className="icon">
                        <i className="fas fa-plus"></i>
                      </span>
                    </button>

                  </h1>


                  {
                    this.props.searchComponent ? 
                    <this.props.searchComponent
                      onSearch={this.handleSearch}
                    />:''
                  }

                  {
                    filteredNotes.map(note=>{
                      return (
                        <div className="row-item">
                          <div>
                            {note.data.title}
                          </div>
                        </div>
                      )
                    })
                  }
                  {
                    this.state.loading ? 
                    <span>Loading...</span>:
                    filteredNotes.length ? '':
                    <div>
                      No Notes
                    </div>
                  }

                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

Apps = GlobalState(Apps);

export default Apps;
