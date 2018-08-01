
/* This array is just for testing purposes.  You will need to
   get the real image data using an AJAX query. */
var photos = [];
var tagList;

// A react component for a tag
class Tag extends React.Component {

    constructor (props) {
    	super(props);
    	this.state = {color: "#6ae"};
	    this.delTag = this.delTag.bind(this);
    }

    delTag(e)
    {
    	e.stopPropagation();
    	var id = this.props.id;
    	this.props.Tag(id);
    }

    render () {
	    return React.createElement('p',  // type
		  { className: 'tagText', style: {backgroundColor: this.state.color}, onClick: this.delTag }, // properties
	      this.props.text // contents
      );   /* can move the deleteTag function inline in the onClick and change the state from tilecontrol but idk how to do the state part*/
    }
};

// A react component for controls on an image tile
class TileControl extends React.Component {
    constructor(props){
	super(props);
	this.state = {tags: this.props.tags.split(",")};
	this.removeTag = this.removeTag.bind(this);
    }

    removeTag(id)
   {
      	var idPhoto = this.props.idNum;
      	var _src = this.props.src;
      	var photoName = _src.split("/").pop();
        photoName = photoName.split('%20').join(' ');
      	var newTags = this.state.tags;
      	newTags.splice(id, 1);
      	var newTagsConcat = newTags.join(",");
      	var oReq = new XMLHttpRequest();
        var url = "delete?key=" + idPhoto +"DEL"+ newTagsConcat; //send the photoName and tag to be deleted
        oReq.open("GET", url);
        oReq.addEventListener("load", function() {
	         this.setState({tags: newTags});
	      }.bind(this));
        //this.forceUpdate();
      	oReq.send();
      	console.log("state.tags (updated): "+this.state.tags);
   }

    render () {
	      console.log("render is called");
	      // remember input vars in closure
        var _selected = this.props.selected;
        var _src = this.props.src;
        // parse image src for photo name
        var photoName = _src.split("/").pop();
        photoName = photoName.split('%20').join(' ');
        var tags = this.state.tags;
        var arrOfTags = [];
	      var i = 0;
        for(; i < tags.length ; i++){
          arrOfTags.push(
            React.createElement( Tag,
            {text: tags[i], key: tags[i] + i, id: i, dTag: this.removeTag /*, deleteTag: function deleteTag(e) {

              console.log("Delete Tag:" + tags[i] + " " + i);} */

            })
          );
        }

        arrOfTags.push(
          React.createElement( Tag,
            {text: 'Add Tag +', key: 'inputKey', id: i+1}))

        return ( React.createElement('div',
          {className: _selected ? 'selectedControls' : 'normalControls'},
          // div contents - so far only one ta
	         arrOfTags
         )// createElement div
        )// return
    } // render
};


// A react component for an image tile
class ImageTile extends React.Component {

    render() {
      // onClick function needs to remember these as a closure
      var _onClick = this.props.onClick;
      var _index = this.props.index;
      var _photo = this.props.photo;
      var _selected = _photo.selected; // this one is just for readability

      return (
          React.createElement('div',
              {style: {margin: this.props.margin, width: _photo.width},
               className: 'tile',
               onClick: function onClick(e) {
                 console.log("tile onclick");
                 // call Gallery's onclick
                 return _onClick (e,
                 { index: _index, photo: _photo })
               }
              }, // end of props of div
              // contents of div - the Controls and an Image
              React.createElement(TileControl,
                {selected: _selected,
                 src: _photo.src,
            		 location: _photo.location,
            		 tags: _photo.tags, idNum: _photo.idNum }),
              React.createElement('img',
                {className: _selected ? 'selected' : 'normal',
                 src: _photo.src,
                 width: _photo.width,
                 height: _photo.height,
		 idNum: _photo.idNum})
          ) //createElement div
      ); // return
    } // render
} // class


// The react component for the whole image gallery
// Most of the code for this is in the included library
class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = { photos: photos };
    this.selectTile = this.selectTile.bind(this);
  }

  selectTile(event, obj) {
    console.log("in onclick!", obj);
    let photos = this.state.photos;
    photos[obj.index].selected = !photos[obj.index].selected;
    this.setState({ photos: photos });
  }

  render() {
    return (
       React.createElement( Gallery, {photos: this.state.photos,
       onClick: this.selectTile,
       ImageComponent: ImageTile} )
      );
  }
}

class Popup extends React.Component {
   constructor(props) {
     super(props);
     this.state = { tagList: tagList };
     this.selectTag = this.selectTag.bind(this);
   }

   selectTag(event, obj) {
     console.log("tag suggestion", obj);
     let tagList = this.state.tagList;
     tagList[obj.index].selected = !tagList[obj.index].selected;
     this.setState({tagList: tagList});
   }

   render() {
     console.log(this.state.tagList); //this was editted in, previously: tagList
     return (
    	 React.createElement(Tag,
    	  {tagList: this.state.tagList,
         onClick: this.selectTag,
         TagComponent: TileControl} )
     );
   }
}

/* Finally, we actually run some code */

const reactContainer = document.getElementById("react");
const popupContainer = document.getElementById("popup");
var reactApp = ReactDOM.render(React.createElement(App),reactContainer);
var reactPopup = ReactDOM.render(React.createElement(Popup), popupContainer);

/* Workaround for bug in gallery where it isn't properly arranged at init */
window.dispatchEvent(new Event('resize'));


function HideMessage() {
    document.getElementById("b1").style.display = "none";
    document.getElementById("b2").style.display = "none";
}

function AutoFunction(){

  var reqIndices = document.getElementById("req-text").value;
  console.log(reqIndices);

  if(reqIndices.length == 2 ){
    //make something later that does nothing for the first letter
    var oReq = new XMLHttpRequest();
    var url = "/query?autocomplete=" + reqIndices;
    oReq.open("GET", url);
    oReq.addEventListener("load", fnCallback);
    oReq.send();
    function fnCallback(err){
	  console.log(oReq.responseText);
  	  var sugList = oReq.responseText;
	  reactPopup.setState({tagList: sugList});
 	  window.dispatchEvent(new Event('resize'));
    }
  }
}

function updateImages()
{
  var reqIndices = document.getElementById("req-text").value;

  if (!reqIndices) return; // No query? Do nothing!

  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/query?keyList=" + reqIndices.replace(/ |,/g, "+")); // We want more input sanitization than this!
  xhr.addEventListener("load", (evt) => {
    if (xhr.status == 200) {
        console.log(xhr.responseText);
        reactApp.setState({photos:JSON.parse(xhr.responseText)});
        window.dispatchEvent(new Event('resize')); /* The world is held together with duct tape */
    } else {
        console.log(xhr.responseText);
        console.log("XHR Error!", xhr.responseText);
    }
  } );
  xhr.send();
}
