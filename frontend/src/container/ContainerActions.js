export const REQUEST_CONTAINERS = 'REQUEST_CONTAINERS';
export const RECEIVE_CONTAINERS = 'RECEIVE_CONTAINERS';

const requestContainers = () => ({
  type: REQUEST_CONTAINERS
});

const receiveContainers = containers => ({
  type: RECEIVE_CONTAINERS,
  containers
});

export const fetchContainers = () => dispatch => {
  dispatch(requestContainers());
  // fetch('http://localhost:8000/container/', {
  //   method: 'GET',
  //   headers: {
  //     'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd'
  //   }
  // })
  // .then(response => response.json())
  // .then(containers => {
  dispatch(receiveContainers(
    [
      {
        "id": "5a28af74f5ec4e1f93095feb",
        "owner": 1,
        "code": "COMP9021",
        "title": "COMP 9021 grades (edited)",
        "school": "UNSW",
        "faculty": "CSE",
        "description": "Grades for COMP 9021 students",
        "sharing": {
            "readOnly": [],
            "readWrite": []
        }
      }
    ]
  ));
  // })
  // .catch(error => {
  //   console.error(error);
  // });
};