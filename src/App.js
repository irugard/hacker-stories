import React from 'react';
import Axios from 'axios';
import './App.css';

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const useSemiPersistentState = (key, initialState) => {

  const isMounted =  React.useRef(false);

  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  );

  React.useEffect(() => {
    if(!isMounted.current){
      isMounted.current = true;
    }else{
      localStorage.setItem(key,value);
    }
  } ,[value, key])

  return [value, setValue];
}

const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(story =>
          action.payload.objectID !== story.objectID),
      };
    default:
      throw new Error();
  }
}

const App = () => {

  const [searchTerm, setSearchTerm] = useSemiPersistentState('search', 'React');
  const [url, setUrl] = React.useState(`${API_ENDPOINT}${searchTerm}`);

  const [stories, dispatchStories] = React.useReducer(
    storiesReducer,
    { data: [], isLoading: false, isError: false });

  const handleFetchStories = React.useCallback(async () => {

    dispatchStories({ type: 'STORIES_FETCH_INIT' });

    try {

      const result = await Axios.get(url);

      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits,
      });
    } catch {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE' });
    }
  }, [url]);

  React.useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories])



  const handleSearchInput = event => {
    setSearchTerm(event.target.value);
  }

  const handleSearchSubmit = event => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);
    event.preventDefault();
  }

  const handleRemoveStory = item => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item
    });
  }


  return (
    <div className="container">
      <h1 className="headline-primary">My Hacker Stories</h1>
      <SearchForm searchTerm={searchTerm}
      onSearchInput={handleSearchInput}
      onSearchSubmit={handleSearchSubmit} />
      <hr />
      {stories.isError && <p>Something went wrong...</p>}
      {stories.isLoading ? (<p>Loading...</p>) :
        <List list={stories.data} onRemoveItem={handleRemoveStory} />}

    </div>
  );
}

const SearchForm = ({
  searchTerm, 
  onSearchInput, 
  onSearchSubmit,
  }) => (
  <form onSubmit={onSearchSubmit} className="search-form">
    <TextInputWithLabel 
      id="search"
      value={searchTerm}
      isFocused 
      onInputChange={onSearchInput} 
    >
      <strong>Search: </strong>
    </TextInputWithLabel>
    <button type="submit" disabled={!searchTerm} className="button button_large">Submit</button>
  </form>
);

const TextInputWithLabel = ({ id, children, value, onInputChange, type = "text", isFocused }) => {
  const inputRef = React.useRef();
  React.useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused])
  return (
    <>
      <label htmlFor={id} className="label">{children}</label>
      &nbsp;
      <input type={type} id={id} value={value} onChange={onInputChange} ref={inputRef} className="input" />
    </>
  );
};

;

const List = ({ list, onRemoveItem }) =>
  list.map(item => <Item key={item.objectID} item={item} onRemoveItem={onRemoveItem} />
  );

const Item = ({ item, onRemoveItem }) => (
  <div className="item">
    <span style={{width: '55%'}}> 
      <a href={item.url}>{item.title} </a>
    </span>
    <span> </span>
    <span style={{width: '15%'}}>{item.author}</span>
    <span> </span>
    <span style={{width: '10%'}}>{item.num_comments}</span>
    <span> </span>
    <span style={{width: '10%'}}>{item.points}</span>
    <span style={{width: '10%'}}>
      <button type='button' onClick={() => onRemoveItem(item)} className="button button_small">
        Remove
      </button>
    </span>
  </div>
);


export default App;



