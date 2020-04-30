import React from 'react'
import Project from './Project'

function Projects(props) {
  let projects = props.projects || []
  return (
    <div className='projects'>
      <div className='table'>
        <div className='row_header'>
          <div className='cell_header'>Actions</div>
          <div className='cell_header'>Project</div>
          <div className='cell_header'>Accessed</div>
          <div className='cell_header'>debug</div>
        </div>
        {
          projects.map((project) => {
            let id = project.get('id')
            return <Project key={id} project={project} add_task={props.add_task} />
          })
        }
      </div>
    </div>
  )
}

export default Projects;
