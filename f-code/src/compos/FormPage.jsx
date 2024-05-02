import React,{useState} from 'react'
import AWS from 'aws-sdk';
import axios from 'axios';
const { nanoid } = require('nanoid');

const FormPage = () => {
    const [file, setFile] = useState(null);
    const [fileContent, setFileContent] = useState('');

    const S3_BUCKET = 'fovus-txt-3'; 
    const REGION = 'us-east-2';

    AWS.config.update({
        accessKeyId: '<Your-access-key>',
        secretAccessKey: '<your-secret-access-key>'
    });
    const handleFileInput = (e) => {
        setFile(e.target.files[0]);
    }
    const myBucket = new AWS.S3({
        params: { Bucket: S3_BUCKET },
        region: REGION
    });

        const handleSubmit = async (e) => {
            e.preventDefault(); 
            const params = {
                Bucket: S3_BUCKET,
                Key: file.name,
                Body: file 
            };


        //Sending API request to save in DynamoDB
        const textInput = e.target.elements[0].value;
        try {
            const response = await axios.post('https://gs9jzm0qvl.execute-api.us-east-2.amazonaws.com/prod/', {
            textInput: textInput,
            filePath: `${S3_BUCKET}/${file.name}`,
            randomId: nanoid(7)
});
    
            if (response.status === 200) {
                console.log('Success! Data saved to DynamoDB');
            } else {
                console.error('Error saving data:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        //Putting File in S3 bucket
        myBucket.putObject(params)
            .on('httpUploadProgress', (e) => {
                console.log("Progress:", Math.round((e.loaded / e.total) * 100));
            })
            .send((err) => {
                if (err) console.log(err);
                alert("File uploaded successfully!"); 
            });

        if (!file) {
            alert('Please select a text file!');
            return;
        }
        // const reader = new FileReader();
        // reader.onload = (e) => { 
        //     setFileContent(e.target.result);
        // };
        // reader.readAsText(file);
    }


  return (
    <div className="flex justify-center mt-10 join">
        <form onSubmit={handleSubmit}>
        
            <label className="form-control w-full max-w-xs">
            <div className="label">
                <span className="label-text">Text Input:</span>
            </div>
            <input type="text" placeholder="Type here" className="input input-bordered w-full max-w-xs" />
            <div className="label">
                <span className="label-text">Pick a file</span>
            </div>
            <input type="file" onChange={handleFileInput}className="file-input file-input-bordered w-full max-w-xs"/>
            <button className="btn btn-primary mt-5" type="submit">submit</button>
            </label>
        </form>
    </div>
    
  )
}

export default FormPage