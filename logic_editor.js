document.onload = init();

function init() {
    init_ui();
    parse_url();
}

function parse_url() {
    var url = document.URL;
    var arr = url.split("proof=");
    if (arr.length > 1) {
        var data = decodeURI(arr[1]);
        load_file(data);
    } 
}

function init_ui() {
    render_latex();
    window.line_count = 0;
    document.onkeydown = key_down;
    document.onkeyup = key_up;
    document.getElementById("save_button").onclick = save_clicked;
    document.getElementById("open_button").onclick = open_clicked;
    document.getElementById("print_button").onclick = print_clicked;
    document.getElementById("clear_button").onclick = clear_clicked;
    document.getElementById("example_button").onclick = example_clicked;
    create_input_line(window.line_count++);
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"help_box"]);
}

function clear_clicked() {
    remove_all_lines();
    document.getElementById("equation").value ="";
}

function example_clicked() {
    data = "allx[P(x)->Q(x)]&~[exxQ(x)]->~[exxP(x)]###allx[P(x)->Q(x)]######Given###~[exxQ(x)]######Given###allx[Q'(X)]###2###Negation of Quantifers###P(x)->Q(x)###1###Universal Instantiation###Q'(x)###3###Universal Instantiation###P'(x)###4 5###Modus Tollens###allx[P'(x)]###6###Universal Generalization###~[exxP(x)]###7###Negation of Quantifers###"
    load_file(data);
}

function save_clicked() {
    var textFileAsBlob = new Blob([pack_data()], {type:'text/plain'});
    var fileNameToSaveAs = "proof.txt";
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null)
    {
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else
    {
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = remove_clicked_element;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }

    downloadLink.click();
}

function pack_data() {
    var content = document.getElementById("equation").value + "###\n";
    for(var i = 0; i < window.line_count; i++) {
        for(var j = 0; j < 3; j++)
                content += get_input(j,i).value + "###";
        content += "\n";
    }
    return content;
}

function remove_clicked_element(event)
{
    document.body.removeChild(event.target);
}

function open_clicked() {
    var file = document.getElementById("file_location").files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        load_file(reader.result);
    };
    reader.readAsText(file);
}

function load_file(data) {
    data = data.replace(/\n/g,"");
    var arr = data.split("###");
    document.getElementById("equation").value = arr[0];
    arr.shift();
    remove_all_lines();
    for(var i = 0; i < Math.floor(arr.length/3); i++) {
        create_input_line(window.line_count++);
        for(var j = 0; j < 3; j++)
            get_input(j,i).value = arr[i*3+j];
    }
    remove_last_line();
    render_latex();
}

function print_clicked() {
    document.getElementById("header").style.display="none";
    document.getElementById("sub_header").style.display="none";
    document.getElementById("control_panel").style.display="none";
    document.getElementById("input_area").style.display="none";
    document.getElementById("help_box").style.display="none";
    render_latex();
    MathJax.Hub.Queue(["Remove",MathJax.Message],window.print);
    document.getElementById("header").style.display="block";
    document.getElementById("sub_header").style.display="block";
    document.getElementById("control_panel").style.display="block";
    document.getElementById("input_area").style.display="block";
    document.getElementById("help_box").style.display="block";
}

function key_down(event) {
    if(event.keyCode == 13)
        add_new_line();
    else if(event.keyCode == 9 && get_selected_line_number() == window.line_count-1) {
        if(get_selected_line_input_id() == 2) {
            create_input_line(window.line_count++);
            get_input(0,window.line_count-1).focus();
            event.preventDefault();
        }
    }
    else if(event.keyCode == 8 && get_selected_line_input_id() == 0) {
        if(get_input(0,get_selected_line_number()).value == "") {
            delete_line();
            event.preventDefault();
        }
    }
    else if(event.keyCode == 38) {
        if(get_selected_line_number() > 0)
            get_input(get_selected_line_input_id(),get_selected_line_number()-1).focus();
    }
    else if(event.keyCode == 40) {
        if(get_selected_line_number() < window.line_count-1)
            get_input(get_selected_line_input_id(),get_selected_line_number()+1).focus();
    }
    else if(event.keyCode == 39) {
        var length = get_input(get_selected_line_input_id(),get_selected_line_number()).value.length
        if(get_input(get_selected_line_input_id(),get_selected_line_number()).selectionStart == length)
            if(get_selected_line_input_id() < 2)
                get_input(get_selected_line_input_id()+1,get_selected_line_number()).focus();
            else if(get_selected_line_number() < window.line_count-1)
                get_input(0,get_selected_line_number()+1).focus();
    }
    else if(event.keyCode == 37 && get_input(get_selected_line_input_id(),get_selected_line_number()).selectionStart == 0) {
        if(get_selected_line_input_id() > 0)
            get_input(get_selected_line_input_id()-1,get_selected_line_number()).focus();
        else if(get_selected_line_number() > 0)
            get_input(2,get_selected_line_number()-1).focus();
    }
    else if(get_selected_line_input_id() == 1 && (event.keyCode < 48 || event.keyCode > 57))
        if(event.keyCode != 8 && event.keyCode != 32 && event.keyCode != 39 && event.keyCode != 37)
            return false;
}

function key_up() {
    render_latex();
}

function render_latex() {
    var latex = "$$" +  parse_logic(document.getElementById("equation").value) + "$$";
    latex += " \\begin{array}{l l}";
    for(var i = 0; i < window.line_count; i++) {
        var line = get_input_line(i);
        latex += "\\text {" + (i+1) + ". }" ; 
        latex += parse_logic(line[0].value) + " & ";
        latex += parse_refs(line[1].value);
        latex += "\\text{" + parse_rules(line,line[2].value)+"}\\\\ ";
    }
    latex += "\\end{array}";
    document.getElementById("output_area").innerHTML = latex;
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"output_area"]);
}

function parse_logic(s) {
    s = s.replace(/&/g," \\wedge ");
    s = s.replace(/\|/g," \\vee ");
    s = s.replace(/->/g," \\Rightarrow ");
    s = s.replace(/<>/g," \\iff ");
    s = s.replace(/ex/g," \\exists ");
    s = s.replace(/all/g," \\forall ");
    s = s.replace(/~/g," \\lnot ");
    s = s.replace(/xor/g," \\oplus ");
    return s;
}

function parse_refs(s) {
    s = s.replace(/ /g,", ");
    return s;
}

function parse_rules(line,rule) {
    if(line[1].value != "" && rule != "")
        return ", " + rule;
    return rule;
}

function delete_line() {
    var num = get_selected_line_number();
    if(num > 0) {
        delete_ref(num);
        shift_up(num);
        remove_last_line();
        get_input(0,num-1).focus();
    }
}

function delete_ref(ref) {
    ref += 1
    for(var i = 0; i < window.line_count; i++) {
        var arr = get_input(1,i).value.split(" ");
        var str = ""
        for(var j = 0; j < arr.length; j++) {
            if(arr[j] != ref) {
                str += arr[j];
                if(j < arr.length - 1)
                    str += " ";
            }
        }
        get_input(1,i).value = str;
    }
}

function add_new_line() {
    var selected_num = get_selected_line_number();
    create_input_line(window.line_count++);
    get_input(0,window.line_count-1).focus();
    if(get_selected_line_number() != window.line_count-2) {
        shift_down(selected_num);
        get_input(0,selected_num+1).focus();
    }
}

function remove_last_line() {
    var i = get_input(0,window.line_count-1);
    i.parentNode.parentNode.removeChild(i.parentNode);
    window.line_count--;
}

function shift_down(start_line_number) {
    for(var i = window.line_count-1; i > start_line_number; i--)
        for(var j = 0; j < 3; j++) {
            get_input(j,i).value = get_input(j,i-1).value;
            if(j == 1) {
                var numbers = get_input(j,i).value.split(" ");
                var str = "";
                for(var z = 0; z < numbers.length; z++) {
                    if((+numbers[z])>start_line_number+1)
                        str += (+numbers[z])+1;
                    else 
                        str += numbers[z];
                    if (z < numbers.length - 1)
                        str += " ";
                }
                get_input(j,i).value = str;
            }
        }
    clear_line(start_line_number+1);
}

function shift_up(start_line_number) {
    for(var i = start_line_number; i < window.line_count-1; i++)
        for(var j = 0; j < 3; j++) {
            get_input(j,i).value = get_input(j,i+1).value;
            if(j == 1) {
                var numbers = get_input(j,i).value.split(" ");
                var str = "";
                for(var z = 0; z < numbers.length; z++) {
                    if((+numbers[z])>start_line_number+1)
                        str += ((+numbers[z])-1);
                    else 
                        str += numbers[z];
                    if (z < numbers.length - 1)
                        str += " ";
                }
                get_input(j,i).value = str;
            }
        }
    // add line -- for refs
}

function create_input_line(line_number) {
    var div = document.createElement("div");
    var number = document.createElement("span");
    number.className = "number";
    number.innerHTML = (line_number+1)+". ";
    div.appendChild(number);
    for(var i = 0; i < 3; i++) {
        var element = document.createElement("input");
        element.id = "line_" + i + "_" + line_number;
        div.appendChild(element);
    }
    document.getElementById("input_area").appendChild(div);
}

function get_input_line(line_number) {
    var arr = new Array();
    for(var i = 0; i < 3; i++)
        arr.push(document.getElementById("line_"+i+"_"+line_number));
    return arr;
}

function get_selected_line_number() {
    var active_id = document.activeElement.id;
    if(active_id.indexOf("line_") == -1)
        return -1;
    return +active_id.split('_')[2];
}

function get_selected_line_input_id() {
    var active_id = document.activeElement.id;
    if(active_id.indexOf("line_") == -1)
        return -1;
    return +active_id.split('_')[1];
}

function get_input(i,n) {
    return document.getElementById("line_"+i+"_"+n);
}

function clear_line(line_number) {
    for(var j = 0; j < 3; j++)
        get_input(j,line_number).value = "";
}

function remove_all_lines() {
    var count = window.line_count-1;
    for(var i = 0; i < count; i++)
        remove_last_line();
    clear_line(0);
    render_latex();
}