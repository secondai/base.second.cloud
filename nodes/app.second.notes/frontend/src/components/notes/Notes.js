import React, { Component } from 'react';
import PropTypes from 'prop-types';

import GlobalState from 'second-fe-react-hoc-globalstate';

import './styles.css'

class Apps extends Component {
  static propTypes = {
    title: PropTypes.string
  };

  constructor(props){
    super(props);
    
    this.state = {
      notes: []
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
    })
    
  }

  createNote = async () => {
    // create note here 
  }

  render(){
    console.log('Apps props:', this.props);
    
    return (
      <section className="hero is-fullheight is-white has-background-info">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-6">

                <div className="box" style={{background:'white'}}>

                  <h1 className="title" onClick={this.fetchApps} style={{borderBottom:'2px solid #ddd', paddingBottom:'24px'}}>
                    {this.props.title || 'No Note Title'}
                  </h1>

                  {
                    this.state.notes.map(note=>{
                      return (
                        <div className="row-item">
                          <a>
                            {note.name}
                          </a>
                        </div>
                      )
                    })
                  }
                  {
                    this.state.loading ? 
                    <span>Loading...</span>:
                    this.state.notes.length ? '':
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
