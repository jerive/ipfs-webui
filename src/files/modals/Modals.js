import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'redux-bundler-react'
import { join } from 'path'
import { translate } from 'react-i18next'
import Overlay from '../../components/overlay/Overlay'
import NewFolderModal from './new-folder-modal/NewFolderModal'
import ShareModal from './share-modal/ShareModal'
import RenameModal from './rename-modal/RenameModal'
import DeleteModal from './delete-modal/DeleteModal'

const NEW_FOLDER = 'new_folder'
const SHARE = 'share'
const RENAME = 'rename'
const DELETE = 'delete'

export {
  NEW_FOLDER,
  SHARE,
  RENAME,
  DELETE
}

class Modals extends React.Component {
  static propTypes = {
    t: PropTypes.func,
    show: PropTypes.string,
    files: PropTypes.array,
    doFilesMove: PropTypes.func,
    doFilesMakeDir: PropTypes.func,
    doFilesShareLink: PropTypes.func,
    doFilesDelete: PropTypes.func
  }

  state = {
    readyToShow: false,
    rename: {
      folder: false,
      path: '',
      filename: ''
    },
    delete: {
      files: 0,
      folder: 0,
      paths: []
    },
    link: ''
  }

  makeDir = (path) => {
    const { doFilesMakeDir, root } = this.props

    doFilesMakeDir(join(root, path))
    this.leave()
  }

  rename = (newName) => {
    const { filename, path } = this.state.rename
    const { doFilesMove } = this.props

    if (newName !== '' && newName !== filename) {
      doFilesMove(path, path.replace(filename, newName))
    }

    this.leave()
  }

  delete = () => {
    const { paths } = this.state.delete

    this.props.doFilesDelete(paths)
    this.leave()
  }

  leave = () => {
    this.setState({ readyToShow: false })
    this.props.done()
  }

  componentDidUpdate (prev) {
    const { show, files, t, doFilesShareLink } = this.props

    if (show === prev.show) {
      return
    }

    if (show === SHARE) {
      this.setState({
        link: t('generating'),
        readyToShow: true
      })

      doFilesShareLink(files).then(link => this.setState({ link }))
    } else if (show === RENAME) {
      const file = files[0]

      this.setState({
        readyToShow: true,
        rename: {
          folder: file.type === 'directory',
          path: file.path,
          filename: file.path.split('/').pop()
        }
      })
    } else if (show === DELETE) {
      let filesCount = 0
      let foldersCount = 0

      files.forEach(file => file.type === 'file' ? filesCount++ : foldersCount++)

      this.setState({
        readyToShow: true,
        delete: {
          files: filesCount,
          folders: foldersCount,
          paths: files.map(f => f.path)
        }
      })
    } else {
      this.setState({ readyToShow: true })
    }
  }

  render () {
    const { show } = this.props
    const { readyToShow, link, rename } = this.state

    return (
      <div>
        <Overlay show={show === NEW_FOLDER && readyToShow} onLeave={this.leave}>
          <NewFolderModal
            className='outline-0'
            onCancel={this.leave}
            onSubmit={this.makeDir} />
        </Overlay>

        <Overlay show={show === SHARE && readyToShow} onLeave={this.leave}>
          <ShareModal
            className='outline-0'
            link={link}
            onLeave={this.leave} />
        </Overlay>

        <Overlay show={show === RENAME && readyToShow} onLeave={this.leave}>
          <RenameModal
            className='outline-0'
            { ...rename }
            onCancel={this.leave}
            onSubmit={this.rename} />
        </Overlay>

        <Overlay show={show === DELETE && readyToShow} onLeave={this.leave}>
          <DeleteModal
            className='outline-0'
            { ...this.state.delete }
            onCancel={this.leave}
            onDelete={this.delete} />
        </Overlay>
      </div>
    )
  }
}

export default connect(
  'doFilesMove',
  'doFilesMakeDir',
  'doFilesShareLink',
  'doFilesDelete',
  translate('files')(Modals)
)
